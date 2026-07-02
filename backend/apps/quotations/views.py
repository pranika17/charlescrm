from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import QuotationPermission
from apps.projects.models import Project
from apps.quotations.models import Quotation
from apps.quotations.serializers import QuotationSerializer


def build_project_code(quotation):
    base = quotation.project_name.upper().replace("&", " ").replace("/", " ")
    parts = [part[:3] for part in base.split() if part]
    code_prefix = "".join(parts[:3]) or "QTN"
    return f"{code_prefix[:9]}-{quotation.id:03d}"


class QuotationListCreateView(generics.ListCreateAPIView):
    queryset = Quotation.objects.all().order_by("-quotation_date", "-created_at")
    serializer_class = QuotationSerializer
    permission_classes = [QuotationPermission]
    search_fields = ("quotation_number", "project_name", "client_name", "location")
    filterset_fields = ("status",)


class QuotationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
    permission_classes = [QuotationPermission]


class ConvertQuotationToProjectView(APIView):
    permission_classes = [QuotationPermission]

    def post(self, request, pk):
        quotation = Quotation.objects.get(pk=pk)

        if quotation.converted_project:
            return Response(QuotationSerializer(quotation).data, status=status.HTTP_200_OK)

        project = Project.objects.create(
            name=quotation.project_name,
            code=build_project_code(quotation),
            client_name=quotation.client_name,
            location=quotation.location,
            description=quotation.description,
            start_date=timezone.localdate(),
            end_date=quotation.valid_until,
            status=Project.Status.PLANNING,
            estimated_budget=quotation.subtotal,
            estimated_revenue=quotation.total_amount,
            project_type="quotation_converted",
            created_by=request.user,
        )
        quotation.converted_project = project
        quotation.status = Quotation.Status.CONVERTED
        quotation.save(update_fields=["converted_project", "status", "updated_at"])

        return Response(QuotationSerializer(quotation).data, status=status.HTTP_200_OK)
