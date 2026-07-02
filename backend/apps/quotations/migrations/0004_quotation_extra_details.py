from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("quotations", "0003_quotation_advance_balance"),
    ]

    operations = [
        migrations.AddField(
            model_name="quotation",
            name="client_phone",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name="quotation",
            name="client_email",
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name="quotation",
            name="site_contact_name",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="quotation",
            name="work_duration",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="quotation",
            name="payment_terms",
            field=models.TextField(blank=True),
        ),
    ]
