from django.db import models
from apps.projects.models import Project

class Equipment(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="equipment_entries",
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=255)

    equipment_type = models.CharField(
        max_length=100
    )

    daily_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        default="available"
    )

    def __str__(self):
        return self.name
