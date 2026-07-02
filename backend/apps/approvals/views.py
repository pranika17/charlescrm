from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.approvals.models import ApprovalRequest
from apps.approvals.serializers import ApprovalRequestSerializer
from apps.common.permissions import ApprovalActionPermission, ApprovalListPermission


class ApprovalRequestListCreateView(generics.ListCreateAPIView):
    queryset = ApprovalRequest.objects.all().order_by("-requested_at")
    serializer_class = ApprovalRequestSerializer
    permission_classes = [ApprovalListPermission]


class ApprovalActionView(APIView):
    permission_classes = [ApprovalActionPermission]

    def post(self, request, pk, action):
        approval = ApprovalRequest.objects.get(pk=pk)
        approval.status = ApprovalRequest.Status.APPROVED if action == "approve" else ApprovalRequest.Status.REJECTED
        approval.approved_by = request.user
        approval.actioned_at = timezone.now()
        approval.remarks = request.data.get("remarks", approval.remarks)
        approval.save(update_fields=["status", "approved_by", "actioned_at", "remarks"])
        return Response(ApprovalRequestSerializer(approval).data, status=status.HTTP_200_OK)
