from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.projects.models import Project


class ApprovalRequest(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="approval_requests")
    module_name = models.CharField(max_length=100)
    record_id = models.PositiveIntegerField()
    request_type = models.CharField(max_length=100)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="approval_requests")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_requests",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remarks = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    actioned_at = models.DateTimeField(null=True, blank=True)
