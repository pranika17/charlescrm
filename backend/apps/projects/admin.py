from django.contrib import admin

from apps.projects.models import DailyLog, Project, ProjectMember


admin.site.register(Project)
admin.site.register(ProjectMember)
admin.site.register(DailyLog)
