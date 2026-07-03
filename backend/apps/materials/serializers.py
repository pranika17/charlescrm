from rest_framework import serializers

from apps.common.calculations import line_total
from apps.materials.models import Material, MaterialPurchase, MaterialUsage


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = "__all__"


class MaterialPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialPurchase
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at", "total_amount")

    def validate(self, attrs):
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", None))
        unit_rate = attrs.get("unit_rate", getattr(self.instance, "unit_rate", None))

        if quantity is not None and quantity <= 0:
            raise serializers.ValidationError({"quantity": "Purchase quantity must be greater than zero."})
        if unit_rate is not None and unit_rate <= 0:
            raise serializers.ValidationError({"unit_rate": "Unit rate must be greater than zero."})

        attrs["total_amount"] = line_total(quantity, unit_rate)
        return attrs


class MaterialUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialUsage
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")

    def validate(self, attrs):
        quantity_used = attrs.get("quantity_used", getattr(self.instance, "quantity_used", None))
        quantity_wasted = attrs.get("quantity_wasted", getattr(self.instance, "quantity_wasted", 0))

        if quantity_used is not None and quantity_used <= 0:
            raise serializers.ValidationError({"quantity_used": "Quantity used must be greater than zero."})
        if quantity_wasted is not None and quantity_wasted < 0:
            raise serializers.ValidationError({"quantity_wasted": "Quantity wasted cannot be negative."})

        return attrs
