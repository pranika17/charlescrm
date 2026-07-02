from rest_framework import serializers

from apps.materials.models import Material, MaterialPurchase, MaterialUsage


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = "__all__"


class MaterialPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialPurchase
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")


class MaterialUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialUsage
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")
