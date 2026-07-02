from rest_framework import generics

from apps.common.permissions import LaborPermission
from apps.labor.models import LaborEntry
from apps.labor.serializers import LaborEntrySerializer


class LaborEntryListCreateView(generics.ListCreateAPIView):
    serializer_class = LaborEntrySerializer
    permission_classes = [LaborPermission]

    def get_queryset(self):
        queryset = LaborEntry.objects.all().order_by("-work_date")
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
