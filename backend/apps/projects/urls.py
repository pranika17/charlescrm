from django.urls import path

from apps.projects.views import DailyLogListCreateView, ProjectDetailView, ProjectListCreateView, ProjectSummaryView


urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project-list-create"),
    path("<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("<int:pk>/summary/", ProjectSummaryView.as_view(), name="project-summary"),
    path("<int:project_id>/daily-logs/", DailyLogListCreateView.as_view(), name="daily-log-list-create"),
]
