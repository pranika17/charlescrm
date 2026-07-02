from django.urls import path

from apps.dashboard.views import DashboardOverviewView, ProfitLossAlertEmailView, SmartAlertListView


urlpatterns = [
    path("overview/", DashboardOverviewView.as_view(), name="dashboard-overview"),
    path("alerts/", SmartAlertListView.as_view(), name="dashboard-alerts"),
    path("profit-loss-alert-email/", ProfitLossAlertEmailView.as_view(), name="dashboard-profit-loss-alert-email"),
]
