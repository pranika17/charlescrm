from rest_framework import generics

from apps.common.permissions import FinancePermission
from apps.expenses.models import Expense
from apps.expenses.serializers import ExpenseSerializer


class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [FinancePermission]

    def get_queryset(self):
        queryset = Expense.objects.all().order_by("-expense_date")
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
