from django.urls import path

from apps.expenses.views import ExpenseListCreateView


urlpatterns = [
    path("", ExpenseListCreateView.as_view(), name="expense-list-create"),
]
