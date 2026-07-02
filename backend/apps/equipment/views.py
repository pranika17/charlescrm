from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets

from .models import Equipment
from .serializers import EquipmentSerializer


class EquipmentViewSet(
    viewsets.ModelViewSet
):

    serializer_class = EquipmentSerializer

    def get_queryset(self):
        queryset = Equipment.objects.select_related("project").all().order_by("name")
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset
