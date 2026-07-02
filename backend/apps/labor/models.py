from django.db import models

from apps.common.models import UserStampedModel
from apps.projects.models import Project


class LaborEntry(UserStampedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="labor_entries")
    work_date = models.DateField()
    labor_type = models.CharField(max_length=100)
    worker_name = models.CharField(max_length=255)
    contractor_name = models.CharField(max_length=255, blank=True)
    attendance_days = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    wage_per_day = models.DecimalField(max_digits=12, decimal_places=2)
    overtime_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-work_date", "-created_at")
