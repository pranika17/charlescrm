from rest_framework import generics

from apps.common.permissions import MaterialPermission
from apps.materials.models import Material, MaterialPurchase, MaterialUsage
from apps.materials.serializers import MaterialPurchaseSerializer, MaterialSerializer, MaterialUsageSerializer


class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = Material.objects.all().order_by("name")
    serializer_class = MaterialSerializer
    permission_classes = [MaterialPermission]


class MaterialPurchaseListCreateView(generics.ListCreateAPIView):
    serializer_class = MaterialPurchaseSerializer
    permission_classes = [MaterialPermission]

    def get_queryset(self):
        queryset = MaterialPurchase.objects.all().order_by("-purchase_date")
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MaterialUsageListCreateView(generics.ListCreateAPIView):
    serializer_class = MaterialUsageSerializer
    permission_classes = [MaterialPermission]

    def get_queryset(self):
        queryset = MaterialUsage.objects.all().order_by("-usage_date")
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
