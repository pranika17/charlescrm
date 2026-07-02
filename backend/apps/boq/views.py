from rest_framework import viewsets
from .models import BOQ
from .serializers import BOQSerializer


class BOQViewSet(viewsets.ModelViewSet):

    serializer_class = BOQSerializer

    def get_queryset(self):
        queryset = BOQ.objects.select_related("project").all().order_by("-id")
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset
