from django.db import models

from apps.common.models import UserStampedModel
from apps.projects.models import Project


class Expense(UserStampedModel):
    class ExpenseType(models.TextChoices):
        DIRECT = "direct", "Direct Expense"
        INDIRECT = "indirect", "Indirect Expense"
        MISC = "misc", "Misc Expense"

    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="expenses")
    expense_date = models.DateField()
    expense_type = models.CharField(max_length=20, choices=ExpenseType.choices, default=ExpenseType.DIRECT)
    category = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    vendor_name = models.CharField(max_length=255, blank=True)
    payment_mode = models.CharField(max_length=100, blank=True)
    receipt_number = models.CharField(max_length=100, blank=True)
    attachment_reference = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    history_note = models.TextField(blank=True)
    approval_status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)

    class Meta:
        ordering = ("-expense_date", "-created_at")
