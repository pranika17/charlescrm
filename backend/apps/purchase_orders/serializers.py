from rest_framework import serializers

from .models import PurchaseOrder


class PurchaseOrderSerializer(
    serializers.ModelSerializer
):
    project_name = serializers.CharField(source="project.name", read_only=True)
    vendor_name = serializers.CharField(source="vendor.name", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = "__all__"

    def validate(self, attrs):
        project = attrs.get("project") or getattr(self.instance, "project", None)
        if project is None:
            raise serializers.ValidationError({"project": "Choose a project before saving purchase order."})
        return attrs
