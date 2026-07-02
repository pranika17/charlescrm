from django.db import models
from apps.projects.models import Project
from apps.vendors.models import Vendor

class PurchaseOrder(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="purchase_orders",
        null=True,
        blank=True,
    )
    po_number = models.CharField(
        max_length=50,
        unique=True
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE
    )

    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        default="pending"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.po_number
