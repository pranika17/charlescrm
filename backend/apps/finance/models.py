from django.db import models

from apps.common.models import UserStampedModel
from apps.projects.models import Project


class Payment(UserStampedModel):
    class PaymentType(models.TextChoices):
        INCOMING = "incoming", "Incoming"
        OUTGOING = "outgoing", "Outgoing"

    class PaymentCategory(models.TextChoices):
        CLIENT_PAYMENT = "client_payment", "Client Payment"
        ADVANCE = "advance", "Advance"
        PARTIAL = "partial", "Partial Payment"
        FINAL = "final", "Final Payment"
        VENDOR = "vendor", "Vendor Payment"
        LABOUR = "labour", "Labour Payment"
        MATERIAL = "material", "Material Payment"
        EQUIPMENT = "equipment", "Equipment Payment"
        SUBCONTRACTOR = "subcontractor", "Subcontractor Payment"
        MISC = "misc", "Misc Payment"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        PAID = "paid", "Paid"
        RECEIVED = "received", "Received"
        REJECTED = "rejected", "Rejected"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="payments")
    payment_date = models.DateField()
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices)
    payment_category = models.CharField(max_length=30, choices=PaymentCategory.choices, default=PaymentCategory.CLIENT_PAYMENT)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=100, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    received_from = models.CharField(max_length=255, blank=True)
    due_date = models.DateField(null=True, blank=True)
    receipt_reference = models.CharField(max_length=255, blank=True)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    approval_note = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-payment_date", "-created_at")


class ProjectBudget(UserStampedModel):
    class ApprovalStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="finance_budgets")
    project_budget = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    category = models.CharField(max_length=120)
    allocated_amount = models.DecimalField(max_digits=14, decimal_places=2)
    revised_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    approval_status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    revision_note = models.TextField(blank=True)

    class Meta:
        ordering = ("-created_at",)


class PettyCash(UserStampedModel):
    class CashType(models.TextChoices):
        ISSUE = "issue", "Cash Issue"
        EXPENSE = "expense", "Cash Expense"
        RETURN = "return", "Cash Return"
        SETTLEMENT = "settlement", "Settlement"

    class CashStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        SETTLED = "settled", "Settled"
        REJECTED = "rejected", "Rejected"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="petty_cash_entries")
    cash_type = models.CharField(max_length=20, choices=CashType.choices)
    issued_to = models.CharField(max_length=255)
    issued_by = models.CharField(max_length=255, blank=True)
    entry_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    expense_category = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    receipt_reference = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=CashStatus.choices, default=CashStatus.PENDING)
    approved_by = models.CharField(max_length=255, blank=True)
    approved_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ("-entry_date", "-created_at")


class CollectionFollowUp(UserStampedModel):
    class CollectionStatus(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        PENDING = "pending", "Pending"
        OVERDUE = "overdue", "Overdue"
        COLLECTED = "collected", "Collected"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="collection_followups")
    client_name = models.CharField(max_length=255)
    expected_date = models.DateField()
    expected_amount = models.DecimalField(max_digits=14, decimal_places=2)
    forecast_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=CollectionStatus.choices, default=CollectionStatus.PENDING)
    follow_up_note = models.TextField(blank=True)
    history_note = models.TextField(blank=True)

    class Meta:
        ordering = ("expected_date", "-created_at")


class CashFlowEntry(UserStampedModel):
    class PeriodType(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="cash_flow_entries")
    period_type = models.CharField(max_length=20, choices=PeriodType.choices, default=PeriodType.DAILY)
    flow_date = models.DateField()
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cash_in = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cash_out = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    closing_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-flow_date", "-created_at")
