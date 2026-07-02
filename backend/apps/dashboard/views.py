import smtplib
from decimal import Decimal

from django.conf import settings
from django.db.models import Count, Sum
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.approvals.models import ApprovalRequest
from apps.common.permissions import DashboardPermission
from apps.expenses.models import Expense
from apps.finance.models import Payment
from apps.labor.models import LaborEntry
from apps.materials.models import MaterialPurchase
from apps.projects.models import Project


ZERO = Decimal("0.00")
BUDGET_WARNING_THRESHOLD = Decimal("0.90")
LABOR_COST_THRESHOLD = Decimal("0.35")
MATERIAL_COST_THRESHOLD = Decimal("0.45")
PENDING_PAYMENT_CRITICAL_THRESHOLD = Decimal("0.40")


def format_money(value):
    return f"Rs {Decimal(value or ZERO):,.2f}"


def get_dashboard_overview_data():
    total_projects = Project.objects.count()
    active_projects = Project.objects.filter(status=Project.Status.ACTIVE).count()
    total_labor = LaborEntry.objects.aggregate(total=Sum("total_amount"))["total"] or ZERO
    total_material = MaterialPurchase.objects.aggregate(total=Sum("total_amount"))["total"] or ZERO
    total_expenses = Expense.objects.aggregate(total=Sum("amount"))["total"] or ZERO
    total_received = Payment.objects.filter(payment_type=Payment.PaymentType.INCOMING).aggregate(total=Sum("amount"))["total"] or ZERO
    total_outgoing = Payment.objects.filter(payment_type=Payment.PaymentType.OUTGOING).aggregate(total=Sum("amount"))["total"] or ZERO
    total_expected_revenue = Project.objects.aggregate(total=Sum("estimated_revenue"))["total"] or ZERO
    pending_approvals = ApprovalRequest.objects.filter(status=ApprovalRequest.Status.PENDING).count()
    total_spend = total_labor + total_material + total_expenses + total_outgoing

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_labor_cost": total_labor,
        "total_material_cost": total_material,
        "total_other_expenses": total_expenses,
        "total_outgoing_payments": total_outgoing,
        "total_received": total_received,
        "total_expected_revenue": total_expected_revenue,
        "pending_amount": max(total_expected_revenue - total_received, ZERO),
        "total_spend": total_spend,
        "profit_or_loss": total_received - total_spend,
        "pending_approvals": pending_approvals,
        "project_status_breakdown": list(Project.objects.values("status").annotate(count=Count("id"))),
    }


def get_active_project_profit_loss_rows():
    rows = []

    for project in Project.objects.filter(status=Project.Status.ACTIVE).order_by("name"):
        labor_cost = LaborEntry.objects.filter(project=project).aggregate(total=Sum("total_amount"))["total"] or ZERO
        material_cost = MaterialPurchase.objects.filter(project=project).aggregate(total=Sum("total_amount"))["total"] or ZERO
        other_expenses = Expense.objects.filter(project=project).aggregate(total=Sum("amount"))["total"] or ZERO
        total_received = Payment.objects.filter(project=project, payment_type=Payment.PaymentType.INCOMING).aggregate(total=Sum("amount"))["total"] or ZERO
        outgoing_payments = Payment.objects.filter(project=project, payment_type=Payment.PaymentType.OUTGOING).aggregate(total=Sum("amount"))["total"] or ZERO
        total_spend = labor_cost + material_cost + other_expenses + outgoing_payments
        profit_or_loss = total_received - total_spend
        rows.append(
            {
                "project": project,
                "total_received": total_received,
                "outgoing_payments": outgoing_payments,
                "total_spend": total_spend,
                "profit_or_loss": profit_or_loss,
            }
        )

    return rows


class DashboardOverviewView(APIView):
    permission_classes = [DashboardPermission]

    def get(self, request):
        return Response(get_dashboard_overview_data())


class SmartAlertListView(APIView):
    permission_classes = [DashboardPermission]

    def get(self, request):
        today = timezone.localdate()
        alerts = []
        pending_projects = []

        for project in Project.objects.all().order_by("-created_at"):
            labor_cost = LaborEntry.objects.filter(project=project).aggregate(total=Sum("total_amount"))["total"] or ZERO
            material_cost = MaterialPurchase.objects.filter(project=project).aggregate(total=Sum("total_amount"))["total"] or ZERO
            other_expenses = Expense.objects.filter(project=project).aggregate(total=Sum("amount"))["total"] or ZERO
            total_received = Payment.objects.filter(project=project, payment_type=Payment.PaymentType.INCOMING).aggregate(total=Sum("amount"))["total"] or ZERO
            outgoing_payments = Payment.objects.filter(project=project, payment_type=Payment.PaymentType.OUTGOING).aggregate(total=Sum("amount"))["total"] or ZERO
            total_spend = labor_cost + material_cost + other_expenses + outgoing_payments
            budget = project.estimated_budget or ZERO
            expected_revenue = project.estimated_revenue or ZERO
            pending_amount = max(expected_revenue - total_received, ZERO)

            if pending_amount > 0:
                pending_projects.append(
                    {
                        "project_id": project.id,
                        "project_name": project.name,
                        "project_code": project.code,
                        "client_name": project.client_name,
                        "pending_amount": pending_amount,
                        "expected_revenue": expected_revenue,
                        "received_amount": total_received,
                        "status": project.status,
                    }
                )

            if budget and total_spend > budget:
                alerts.append(
                    {
                        "type": "budget_exceeded",
                        "severity": "critical",
                        "project_id": project.id,
                        "project_name": project.name,
                        "message": f"Spend exceeded budget by {total_spend - budget:.2f}.",
                    }
                )
            elif budget and total_spend > budget * BUDGET_WARNING_THRESHOLD:
                alerts.append(
                    {
                        "type": "budget_warning",
                        "severity": "medium",
                        "project_id": project.id,
                        "project_name": project.name,
                        "message": "Spend crossed 90% of the project budget.",
                    }
                )

            if budget and labor_cost > budget * LABOR_COST_THRESHOLD:
                alerts.append(
                    {
                        "type": "labor_cost_alert",
                        "severity": "medium",
                        "project_id": project.id,
                        "project_name": project.name,
                        "message": "Labor cost crossed 35% of the planned budget.",
                    }
                )

            if budget and material_cost > budget * MATERIAL_COST_THRESHOLD:
                alerts.append(
                    {
                        "type": "material_cost_alert",
                        "severity": "medium",
                        "project_id": project.id,
                        "project_name": project.name,
                        "message": "Material cost crossed 45% of the planned budget.",
                    }
                )

            if expected_revenue and total_received < expected_revenue and project.status in {Project.Status.ACTIVE, Project.Status.ON_HOLD}:
                alerts.append(
                    {
                        "type": "pending_payment",
                        "severity": "medium" if pending_amount < expected_revenue * PENDING_PAYMENT_CRITICAL_THRESHOLD else "critical",
                        "project_id": project.id,
                        "project_name": project.name,
                        "message": f"Pending collection of {pending_amount:.2f} remains against expected revenue.",
                    }
                )

        overdue_incoming = Payment.objects.filter(
            payment_type=Payment.PaymentType.INCOMING,
            due_date__isnull=False,
            due_date__lt=today,
        ).select_related("project")

        for payment in overdue_incoming:
            alerts.append(
                {
                    "type": "overdue_followup",
                    "severity": "critical",
                    "project_id": payment.project_id,
                    "project_name": payment.project.name,
                    "message": f"Incoming payment follow-up is overdue since {payment.due_date}.",
                    "payment_id": payment.id,
                }
            )

        alerts.sort(key=lambda item: (0 if item["severity"] == "critical" else 1, item["project_name"]))
        pending_projects.sort(key=lambda item: float(item["pending_amount"]), reverse=True)

        return Response(
            {
                "generated_on": today,
                "alert_count": len(alerts),
                "alerts": alerts,
                "pending_payments": pending_projects,
            }
        )


class ProfitLossAlertEmailView(APIView):
    permission_classes = [DashboardPermission]

    def post(self, request):
        recipients = list(getattr(settings, "PROFIT_LOSS_ALERT_RECIPIENTS", []))
        if not recipients:
            return Response({"detail": "No profit/loss alert email recipient is configured."}, status=status.HTTP_400_BAD_REQUEST)
        if settings.EMAIL_BACKEND == "django.core.mail.backends.console.EmailBackend":
            return Response(
                {"detail": "Email is still using console mode. Configure SMTP in backend/.env to send real emails."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not settings.EMAIL_HOST or not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            return Response(
                {"detail": "SMTP email is incomplete. Set EMAIL_HOST, EMAIL_HOST_USER, and EMAIL_HOST_PASSWORD in backend/.env."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        overview = get_dashboard_overview_data()
        profit_or_loss = Decimal(overview["profit_or_loss"] or ZERO)
        status_label = "Profit" if profit_or_loss > ZERO else "Loss" if profit_or_loss < ZERO else "Break Even"
        status_message = (
            "Business is currently in profit. Collections are higher than recorded spend."
            if profit_or_loss > ZERO
            else "Business is currently in loss. Recorded spend is higher than collections, so review loss projects and pending collections first."
            if profit_or_loss < ZERO
            else "Business is currently at break even. Collections and spend are balanced."
        )
        generated_on = timezone.localtime(timezone.now()).strftime("%d %b %Y, %I:%M %p")
        project_rows = get_active_project_profit_loss_rows()
        loss_rows = sorted([row for row in project_rows if row["profit_or_loss"] < ZERO], key=lambda row: row["profit_or_loss"])[:5]
        profit_rows = sorted([row for row in project_rows if row["profit_or_loss"] > ZERO], key=lambda row: row["profit_or_loss"], reverse=True)[:5]

        lines = [
            "Charles CRM Profit & Loss Alert",
            f"Generated: {generated_on}",
            "",
            f"Overall Status: {status_label}",
            f"Profit/Loss Message: {status_message}",
            f"Net P / L: {format_money(profit_or_loss)}",
            f"Expected Revenue: {format_money(overview['total_expected_revenue'])}",
            f"Received: {format_money(overview['total_received'])}",
            f"Total Spend: {format_money(overview['total_spend'])}",
            f"Pending Collection: {format_money(overview['pending_amount'])}",
            "",
            "Top Loss Projects:",
        ]

        if loss_rows:
            lines.extend(
                f"- {row['project'].code or row['project'].name}: {format_money(abs(row['profit_or_loss']))} loss "
                f"(Received {format_money(row['total_received'])}, Spend {format_money(row['total_spend'])})"
                for row in loss_rows
            )
        else:
            lines.append("- No active projects are currently in loss.")

        lines.extend(["", "Top Profit Projects:"])

        if profit_rows:
            lines.extend(
                f"- {row['project'].code or row['project'].name}: {format_money(row['profit_or_loss'])} profit "
                f"(Received {format_money(row['total_received'])}, Spend {format_money(row['total_spend'])})"
                for row in profit_rows
            )
        else:
            lines.append("- No active projects are currently in profit.")

        try:
            send_mail(
                subject=f"Charles CRM P/L Alert: {status_label} {format_money(profit_or_loss)}",
                message="\n".join(lines),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                fail_silently=False,
            )
        except smtplib.SMTPAuthenticationError:
            return Response(
                {"detail": "Gmail rejected the email login. Use a Gmail App Password in EMAIL_HOST_PASSWORD, not the normal Gmail password."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:
            return Response({"detail": f"Profit/loss alert email could not be sent: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(
            {
                "detail": "Profit/loss alert email sent.",
                "sent_to": recipients,
                "status": status_label,
                "profit_or_loss": profit_or_loss,
            }
        )
