from rest_framework import viewsets

from .models import PurchaseOrder
from .serializers import PurchaseOrderSerializer


class PurchaseOrderViewSet(
    viewsets.ModelViewSet
):

    serializer_class = PurchaseOrderSerializer

    def get_queryset(self):
        queryset = PurchaseOrder.objects.select_related("project", "vendor").all().order_by("-id")
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset
