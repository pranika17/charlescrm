from rest_framework import serializers

from apps.approvals.models import ApprovalRequest


class ApprovalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalRequest
        fields = "__all__"
