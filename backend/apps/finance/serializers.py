from rest_framework import serializers

from apps.finance.models import CashFlowEntry, CollectionFollowUp, Payment, PettyCash, ProjectBudget


class PositiveAmountMixin:
    amount_fields = ()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        for field in self.amount_fields:
            value = attrs.get(field)
            if value is not None and value < 0:
                raise serializers.ValidationError({field: "Amount cannot be negative."})
        return attrs


class PaymentSerializer(PositiveAmountMixin, serializers.ModelSerializer):
    amount_fields = ("amount",)

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")


class ProjectBudgetSerializer(PositiveAmountMixin, serializers.ModelSerializer):
    amount_fields = ("allocated_amount", "revised_amount")

    class Meta:
        model = ProjectBudget
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")


class PettyCashSerializer(PositiveAmountMixin, serializers.ModelSerializer):
    amount_fields = ("amount",)

    class Meta:
        model = PettyCash
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")


class CollectionFollowUpSerializer(PositiveAmountMixin, serializers.ModelSerializer):
    amount_fields = ("expected_amount", "forecast_amount")

    class Meta:
        model = CollectionFollowUp
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")


class CashFlowEntrySerializer(PositiveAmountMixin, serializers.ModelSerializer):
    amount_fields = ("opening_balance", "cash_in", "cash_out", "closing_balance")

    class Meta:
        model = CashFlowEntry
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")
