from rest_framework import generics

from apps.common.permissions import FinancePermission
from apps.finance.models import CashFlowEntry, CollectionFollowUp, Payment, PettyCash, ProjectBudget
from apps.finance.serializers import CashFlowEntrySerializer, CollectionFollowUpSerializer, PaymentSerializer, PettyCashSerializer, ProjectBudgetSerializer


class ProjectFilteredListCreateView(generics.ListCreateAPIView):
    permission_classes = [FinancePermission]
    ordering = "-created_at"

    def get_queryset(self):
        queryset = self.model.objects.all().order_by(self.ordering)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PaymentListCreateView(ProjectFilteredListCreateView):
    model = Payment
    serializer_class = PaymentSerializer
    ordering = "-payment_date"


class ProjectBudgetListCreateView(ProjectFilteredListCreateView):
    model = ProjectBudget
    serializer_class = ProjectBudgetSerializer


class PettyCashListCreateView(ProjectFilteredListCreateView):
    model = PettyCash
    serializer_class = PettyCashSerializer
    ordering = "-entry_date"


class CollectionFollowUpListCreateView(ProjectFilteredListCreateView):
    model = CollectionFollowUp
    serializer_class = CollectionFollowUpSerializer
    ordering = "expected_date"


class CashFlowEntryListCreateView(ProjectFilteredListCreateView):
    model = CashFlowEntry
    serializer_class = CashFlowEntrySerializer
    ordering = "-flow_date"
