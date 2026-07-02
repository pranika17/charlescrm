from django.db import models

from apps.common.models import UserStampedModel
from apps.projects.models import Project


class ProjectFile(UserStampedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="project_files/")
    file_type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
