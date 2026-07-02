from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("projects", "0002_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Quotation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("quotation_number", models.CharField(max_length=50, unique=True)),
                ("project_name", models.CharField(max_length=255)),
                ("client_name", models.CharField(max_length=255)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("quotation_date", models.DateField(default=django.utils.timezone.localdate)),
                ("valid_until", models.DateField(blank=True, null=True)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("sent", "Sent"), ("approved", "Approved"), ("rejected", "Rejected"), ("converted", "Converted")], default="draft", max_length=20)),
                ("subtotal", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("gst_percent", models.DecimalField(decimal_places=2, default=18, max_digits=5)),
                ("gst_amount", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("profit_margin_percent", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("profit_margin_amount", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("total_amount", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("notes", models.TextField(blank=True)),
                ("converted_project", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="source_quotations", to="projects.project")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="quotation_created", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ("-quotation_date", "-created_at")},
        ),
        migrations.CreateModel(
            name="QuotationLineItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("category", models.CharField(blank=True, max_length=100)),
                ("description", models.CharField(max_length=255)),
                ("quantity", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("unit", models.CharField(blank=True, max_length=50)),
                ("unit_rate", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("line_total", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("quotation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="line_items", to="quotations.quotation")),
            ],
            options={"ordering": ("id",)},
        ),
    ]
