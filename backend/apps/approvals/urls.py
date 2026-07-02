from django.urls import path

from apps.approvals.views import ApprovalActionView, ApprovalRequestListCreateView


urlpatterns = [
    path("", ApprovalRequestListCreateView.as_view(), name="approval-list-create"),
    path("<int:pk>/<str:action>/", ApprovalActionView.as_view(), name="approval-action"),
]
