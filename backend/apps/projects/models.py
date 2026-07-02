from django.conf import settings
from django.db import models

from apps.common.models import UserStampedModel


class Project(UserStampedModel):
    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        ON_HOLD = "on_hold", "On Hold"
        COMPLETED = "completed", "Completed"

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    client_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNING)
    estimated_budget = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    estimated_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    project_type = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_memberships")
    member_role = models.CharField(max_length=100)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "user")


class DailyLog(UserStampedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="daily_logs")
    log_date = models.DateField()
    title = models.CharField(max_length=255)
    description = models.TextField()
    progress_percent = models.PositiveSmallIntegerField(default=0)
    issue_notes = models.TextField(blank=True)
    weather_notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ("-log_date", "-created_at")
