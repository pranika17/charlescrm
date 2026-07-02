from django.urls import path

from apps.labor.views import LaborEntryListCreateView


urlpatterns = [
    path("", LaborEntryListCreateView.as_view(), name="labor-list-create"),
]
