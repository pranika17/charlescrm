from rest_framework import serializers

from apps.common.calculations import labor_total
from apps.labor.models import LaborEntry


class LaborEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LaborEntry
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at", "total_amount")

    def validate(self, attrs):
        attendance_days = attrs.get("attendance_days", getattr(self.instance, "attendance_days", None))
        wage_per_day = attrs.get("wage_per_day", getattr(self.instance, "wage_per_day", None))
        overtime_amount = attrs.get("overtime_amount", getattr(self.instance, "overtime_amount", 0))

        if attendance_days is not None and attendance_days <= 0:
            raise serializers.ValidationError({"attendance_days": "Attendance must be greater than zero."})
        if wage_per_day is not None and wage_per_day <= 0:
            raise serializers.ValidationError({"wage_per_day": "Wage per day must be greater than zero."})
        if overtime_amount is not None and overtime_amount < 0:
            raise serializers.ValidationError({"overtime_amount": "Overtime amount cannot be negative."})

        attrs["total_amount"] = labor_total(attendance_days, wage_per_day, overtime_amount)
        return attrs
