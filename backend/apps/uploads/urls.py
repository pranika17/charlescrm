from django.urls import path

from apps.uploads.views import ProjectFileListCreateView


urlpatterns = [
    path("files/", ProjectFileListCreateView.as_view(), name="project-file-list-create"),
]
