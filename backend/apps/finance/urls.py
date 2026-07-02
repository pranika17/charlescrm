from django.urls import path

from apps.finance.views import (
    CashFlowEntryListCreateView,
    CollectionFollowUpListCreateView,
    PaymentListCreateView,
    PettyCashListCreateView,
    ProjectBudgetListCreateView,
)


urlpatterns = [
    path("budgets/", ProjectBudgetListCreateView.as_view(), name="finance-budget-list-create"),
    path("payments/", PaymentListCreateView.as_view(), name="payment-list-create"),
    path("petty-cash/", PettyCashListCreateView.as_view(), name="petty-cash-list-create"),
    path("collections/", CollectionFollowUpListCreateView.as_view(), name="collection-list-create"),
    path("cash-flow/", CashFlowEntryListCreateView.as_view(), name="cash-flow-list-create"),
]
