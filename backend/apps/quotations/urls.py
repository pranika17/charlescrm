from django.urls import path

from apps.quotations.views import ConvertQuotationToProjectView, QuotationDetailView, QuotationListCreateView


urlpatterns = [
    path("", QuotationListCreateView.as_view(), name="quotation-list-create"),
    path("<int:pk>/", QuotationDetailView.as_view(), name="quotation-detail"),
    path("<int:pk>/convert-to-project/", ConvertQuotationToProjectView.as_view(), name="quotation-convert-to-project"),
]
