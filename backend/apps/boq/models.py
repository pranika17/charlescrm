from django.db import models
from apps.projects.models import Project

class BOQ(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="boq_items",
        null=True,
        blank=True,
    )
    item_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit = models.CharField(max_length=20)
    unit_rate = models.DecimalField(max_digits=12, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_cost(self):
        return self.quantity * self.unit_rate

    def __str__(self):
        return self.item_name
