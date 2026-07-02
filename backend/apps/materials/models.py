from django.db import models

from apps.common.models import TimeStampedModel, UserStampedModel
from apps.projects.models import Project


class Material(TimeStampedModel):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    unit = models.CharField(max_length=50)
    default_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class MaterialPurchase(UserStampedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="material_purchases")
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="purchases")
    supplier_name = models.CharField(max_length=255, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_rate = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    purchase_date = models.DateField()
    invoice_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)


class MaterialUsage(UserStampedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="material_usage_entries")
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="usage_entries")
    usage_date = models.DateField()
    quantity_used = models.DecimalField(max_digits=12, decimal_places=2)
    quantity_wasted = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    area_or_task = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
