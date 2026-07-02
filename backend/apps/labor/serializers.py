from rest_framework import serializers

from apps.labor.models import LaborEntry


class LaborEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LaborEntry
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")
