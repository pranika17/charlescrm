from rest_framework import serializers

from apps.uploads.models import ProjectFile


class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")
