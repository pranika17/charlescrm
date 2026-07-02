from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.common.models import UserStampedModel
from apps.projects.models import Project


class Quotation(UserStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CONVERTED = "converted", "Converted"

    quotation_number = models.CharField(max_length=50, unique=True)
    project_name = models.CharField(max_length=255)
    client_name = models.CharField(max_length=255)
    client_phone = models.CharField(max_length=30, blank=True)
    client_email = models.EmailField(blank=True)
    site_contact_name = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    quotation_date = models.DateField(default=timezone.localdate)
    valid_until = models.DateField(null=True, blank=True)
    work_duration = models.CharField(max_length=120, blank=True)
    payment_terms = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    profit_margin_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    profit_margin_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    advance_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    balance_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    converted_project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="source_quotations",
    )
    parent_quotation = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="revisions",
    )
    revision_number = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ("-quotation_date", "-created_at")

    def __str__(self):
        return f"{self.quotation_number} - {self.project_name}"

    @property
    def root_quotation(self):
        return self.parent_quotation or self


class QuotationLineItem(models.Model):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="line_items")
    category = models.CharField(max_length=100, blank=True)
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=50, blank=True)
    unit_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))

    class Meta:
        ordering = ("id",)

    def __str__(self):
        return f"{self.description} ({self.quotation.quotation_number})"
