from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("quotations", "0005_backfill_quotation_balance"),
    ]

    operations = [
        migrations.AddField(
            model_name="quotation",
            name="parent_quotation",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="revisions",
                to="quotations.quotation",
            ),
        ),
        migrations.AddField(
            model_name="quotation",
            name="revision_number",
            field=models.PositiveIntegerField(default=1),
        ),
    ]
