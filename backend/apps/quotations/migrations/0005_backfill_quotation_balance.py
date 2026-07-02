from django.db import migrations
from django.db.models import F


def backfill_balance_amount(apps, schema_editor):
    Quotation = apps.get_model("quotations", "Quotation")
    Quotation.objects.filter(balance_amount=0).update(balance_amount=F("total_amount") - F("advance_amount"))


class Migration(migrations.Migration):
    dependencies = [
        ("quotations", "0004_quotation_extra_details"),
    ]

    operations = [
        migrations.RunPython(backfill_balance_amount, migrations.RunPython.noop),
    ]
