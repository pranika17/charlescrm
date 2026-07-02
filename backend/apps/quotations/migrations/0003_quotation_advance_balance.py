from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("quotations", "0002_alter_quotation_created_by"),
    ]

    operations = [
        migrations.AddField(
            model_name="quotation",
            name="advance_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="quotation",
            name="balance_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
    ]
