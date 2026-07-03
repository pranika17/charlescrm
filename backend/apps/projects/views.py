from decimal import Decimal

from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import DailyLogPermission, ProjectPermission
from apps.boq.models import BOQ
from apps.equipment.models import Equipment
from apps.expenses.models import Expense
from apps.finance.models import CollectionFollowUp, Payment, PettyCash, ProjectBudget
from apps.labor.models import LaborEntry
from apps.materials.models import MaterialPurchase
from apps.projects.models import DailyLog, Project
from apps.projects.serializers import DailyLogSerializer, ProjectSerializer
from apps.purchase_orders.models import PurchaseOrder


class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.all().order_by("-created_at")
    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermission]
    search_fields = ("name", "code", "client_name", "location")
    filterset_fields = ("status", "project_type")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectDetailView(generics.RetrieveUpdateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermission]


from rest_framework import status
from rest_framework.response import Response

class DailyLogListCreateView(generics.ListCreateAPIView):
    serializer_class = DailyLogSerializer
    permission_classes = [DailyLogPermission]

    def get_queryset(self):
        return DailyLog.objects.filter(
            project_id=self.kwargs["project_id"]
        )

    def post(self, request, *args, **kwargs):
        print("REQUEST DATA:", request.data)

        serializer = self.get_serializer(
            data=request.data
        )

        if not serializer.is_valid():
            print("SERIALIZER ERRORS:")
            print(serializer.errors)

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save(
            project_id=self.kwargs["project_id"],
            created_by=request.user,
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class ProjectSummaryView(APIView):
    permission_classes = [ProjectPermission]

    def get(self, request, pk):
        project = Project.objects.get(pk=pk)
        zero = Decimal("0.00")
        labor_cost = LaborEntry.objects.filter(project=project).aggregate(total=Sum("total_amount"))["total"] or zero
        material_cost = MaterialPurchase.objects.filter(project=project).aggregate(total=Sum("total_amount"))["total"] or zero
        other_expenses = Expense.objects.filter(project=project).aggregate(total=Sum("amount"))["total"] or zero
        boq_total = (
            BOQ.objects.filter(project=project)
            .aggregate(
                total=Sum(
                    ExpressionWrapper(
                        F("quantity") * F("unit_rate"),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                )
            )["total"]
            or zero
        )
        purchase_order_total = PurchaseOrder.objects.filter(project=project).aggregate(total=Sum("total_amount"))["total"] or zero
        equipment_daily_cost = Equipment.objects.filter(project=project).aggregate(total=Sum("daily_cost"))["total"] or zero
        incoming = Payment.objects.filter(project=project, payment_type=Payment.PaymentType.INCOMING).aggregate(total=Sum("amount"))["total"] or zero
        outgoing = Payment.objects.filter(project=project, payment_type=Payment.PaymentType.OUTGOING).aggregate(total=Sum("amount"))["total"] or zero
        budget_rows = ProjectBudget.objects.filter(project=project)
        approved_budget = (
            budget_rows.filter(approval_status=ProjectBudget.ApprovalStatus.APPROVED).aggregate(total=Sum("allocated_amount"))["total"]
            or project.estimated_budget
            or zero
        )
        revised_budget = budget_rows.aggregate(total=Sum("revised_amount"))["total"] or zero
        active_budget = revised_budget or approved_budget or zero
        petty_issue = PettyCash.objects.filter(project=project, cash_type=PettyCash.CashType.ISSUE).aggregate(total=Sum("amount"))["total"] or zero
        petty_expense = PettyCash.objects.filter(project=project, cash_type=PettyCash.CashType.EXPENSE).aggregate(total=Sum("amount"))["total"] or zero
        petty_return = PettyCash.objects.filter(project=project, cash_type=PettyCash.CashType.RETURN).aggregate(total=Sum("amount"))["total"] or zero
        petty_balance = petty_issue - petty_expense - petty_return
        pending_collections = (
            CollectionFollowUp.objects.filter(project=project)
            .exclude(status=CollectionFollowUp.CollectionStatus.COLLECTED)
            .aggregate(total=Sum("expected_amount"))["total"]
            or zero
        )
        total_spend = labor_cost + material_cost + other_expenses + outgoing + petty_expense
        net_profit = incoming - total_spend
        budget_utilization = (total_spend / active_budget * 100) if active_budget else zero
        profit_margin = (net_profit / incoming * 100) if incoming else zero

        return Response(
            {
                "project_id": project.id,
                "estimated_budget": project.estimated_budget,
                "estimated_revenue": project.estimated_revenue,
                "active_budget": active_budget,
                "revised_budget": revised_budget,
                "labor_cost": labor_cost,
                "material_cost": material_cost,
                "other_expenses": other_expenses,
                "boq_total": boq_total,
                "purchase_order_total": purchase_order_total,
                "equipment_daily_cost": equipment_daily_cost,
                "outgoing_payments": outgoing,
                "petty_cash_spend": petty_expense,
                "petty_cash_balance": petty_balance,
                "total_spend": total_spend,
                "projected_total_cost": total_spend + purchase_order_total + equipment_daily_cost,
                "budget_variance": active_budget - total_spend if active_budget else zero,
                "total_received": incoming,
                "pending_collections": pending_collections,
                "pending_payments": outgoing,
                "cash_flow": incoming - total_spend,
                "profit_or_loss": net_profit,
                "net_profit": net_profit if net_profit > zero else zero,
                "net_loss": abs(net_profit) if net_profit < zero else zero,
                "profit_margin_percent": profit_margin,
                "budget_utilization_percent": budget_utilization,
            }
        )
