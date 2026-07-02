from rest_framework import serializers

from apps.expenses.models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Amount cannot be negative.")
        return value

    class Meta:
        model = Expense
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")
