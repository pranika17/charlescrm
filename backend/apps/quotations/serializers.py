from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.quotations.models import Quotation, QuotationLineItem


class QuotationLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationLineItem
        fields = ("id", "category", "description", "quantity", "unit", "unit_rate", "line_total")
        read_only_fields = ("id", "line_total")


class QuotationSerializer(serializers.ModelSerializer):
    line_items = QuotationLineItemSerializer(many=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    converted_project_name = serializers.CharField(source="converted_project.name", read_only=True)
    source_quotation = serializers.PrimaryKeyRelatedField(
        queryset=Quotation.objects.all(),
        required=False,
        write_only=True,
    )
    parent_quotation_number = serializers.CharField(source="parent_quotation.quotation_number", read_only=True)

    class Meta:
        model = Quotation
        fields = (
            "id",
            "quotation_number",
            "project_name",
            "client_name",
            "client_phone",
            "client_email",
            "site_contact_name",
            "location",
            "description",
            "quotation_date",
            "valid_until",
            "work_duration",
            "payment_terms",
            "status",
            "subtotal",
            "gst_percent",
            "gst_amount",
            "profit_margin_percent",
            "profit_margin_amount",
            "total_amount",
            "advance_amount",
            "balance_amount",
            "notes",
            "converted_project",
            "converted_project_name",
            "parent_quotation",
            "parent_quotation_number",
            "revision_number",
            "source_quotation",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
            "line_items",
        )
        read_only_fields = (
            "quotation_number",
            "subtotal",
            "gst_amount",
            "profit_margin_amount",
            "total_amount",
            "balance_amount",
            "converted_project",
            "converted_project_name",
            "parent_quotation",
            "parent_quotation_number",
            "revision_number",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        )

    def validate_line_items(self, value):
        if not value:
            raise serializers.ValidationError("Add at least one line item to the quotation.")
        return value

    def validate(self, attrs):
        quotation_date = attrs.get("quotation_date") or getattr(self.instance, "quotation_date", None)
        valid_until = attrs.get("valid_until") if "valid_until" in attrs else getattr(self.instance, "valid_until", None)

        if quotation_date and valid_until and valid_until < quotation_date:
            raise serializers.ValidationError({"valid_until": "Valid until date cannot be earlier than the quotation date."})

        return attrs

    def _generate_number(self, revision_number=1):
        last_id = (Quotation.objects.order_by("-id").values_list("id", flat=True).first() or 0) + 1
        suffix = f"-R{revision_number:02d}" if revision_number > 1 else ""
        return f"QTN-{last_id:04d}{suffix}"

    def _get_revision_context(self, source_quotation):
        if not source_quotation:
            return None, 1

        parent = source_quotation.parent_quotation or source_quotation
        latest_revision = max(
            parent.revision_number,
            parent.revisions.order_by("-revision_number").values_list("revision_number", flat=True).first() or 1,
        )
        return parent, latest_revision + 1

    def _apply_balance(self, quotation):
        advance_amount = Decimal(quotation.advance_amount or 0)
        total_amount = Decimal(quotation.total_amount or 0)

        if advance_amount < 0:
            raise serializers.ValidationError({"advance_amount": "Advance amount cannot be negative."})
        if advance_amount > total_amount:
            raise serializers.ValidationError({"advance_amount": "Advance amount cannot be greater than the quotation total."})

        quotation.balance_amount = total_amount - advance_amount
        quotation.save(update_fields=["balance_amount", "updated_at"])

    def _apply_totals(self, quotation, items_data):
        subtotal = Decimal("0.00")
        line_items = []

        for item_data in items_data:
            quantity = Decimal(item_data.get("quantity") or 0)
            unit_rate = Decimal(item_data.get("unit_rate") or 0)
            line_total = quantity * unit_rate
            subtotal += line_total
            line_items.append(
                QuotationLineItem(
                    quotation=quotation,
                    category=item_data.get("category", "").strip(),
                    description=item_data.get("description", "").strip(),
                    quantity=quantity,
                    unit=item_data.get("unit", "").strip(),
                    unit_rate=unit_rate,
                    line_total=line_total,
                )
            )

        gst_percent = Decimal(quotation.gst_percent or 0)
        profit_percent = Decimal(quotation.profit_margin_percent or 0)
        profit_amount = (subtotal * profit_percent) / Decimal("100")
        gst_amount = ((subtotal + profit_amount) * gst_percent) / Decimal("100")
        total_amount = subtotal + profit_amount + gst_amount

        advance_amount = Decimal(quotation.advance_amount or 0)
        if advance_amount < 0:
            raise serializers.ValidationError({"advance_amount": "Advance amount cannot be negative."})
        if advance_amount > total_amount:
            raise serializers.ValidationError({"advance_amount": "Advance amount cannot be greater than the quotation total."})

        QuotationLineItem.objects.bulk_create(line_items)

        quotation.subtotal = subtotal
        quotation.profit_margin_amount = profit_amount
        quotation.gst_amount = gst_amount
        quotation.total_amount = total_amount
        quotation.save(update_fields=["subtotal", "profit_margin_amount", "gst_amount", "total_amount", "updated_at"])
        self._apply_balance(quotation)

    def create(self, validated_data):
        with transaction.atomic():
            items_data = validated_data.pop("line_items")
            source_quotation = validated_data.pop("source_quotation", None)
            parent_quotation, revision_number = self._get_revision_context(source_quotation)
            request = self.context.get("request")
            quotation = Quotation.objects.create(
                quotation_number=self._generate_number(revision_number),
                created_by=getattr(request, "user", None),
                parent_quotation=parent_quotation,
                revision_number=revision_number,
                **validated_data,
            )
            self._apply_totals(quotation, items_data)
            return quotation

    def update(self, instance, validated_data):
        with transaction.atomic():
            items_data = validated_data.pop("line_items", None)

            for field, value in validated_data.items():
                setattr(instance, field, value)
            instance.save()

            if items_data is not None:
                instance.line_items.all().delete()
                self._apply_totals(instance, items_data)
            else:
                self._apply_balance(instance)

            return instance
