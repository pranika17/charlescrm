from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser

from apps.common.permissions import DailyLogPermission
from apps.uploads.models import ProjectFile
from apps.uploads.serializers import ProjectFileSerializer


class ProjectFileListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectFileSerializer
    permission_classes = [DailyLogPermission]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = ProjectFile.objects.all().order_by("-created_at")
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
