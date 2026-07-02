from django.urls import path

from apps.materials.views import MaterialListCreateView, MaterialPurchaseListCreateView, MaterialUsageListCreateView


urlpatterns = [
    path("", MaterialListCreateView.as_view(), name="material-list-create"),
    path("purchases/", MaterialPurchaseListCreateView.as_view(), name="material-purchase-list-create"),
    path("usage/", MaterialUsageListCreateView.as_view(), name="material-usage-list-create"),
]
