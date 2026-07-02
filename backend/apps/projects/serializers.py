from rest_framework import serializers

from apps.projects.models import DailyLog, Project, ProjectMember


class ProjectMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = ProjectMember
        fields = ("id", "user", "user_name", "member_role", "assigned_at")

class DailyLogSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.full_name",
        read_only=True
    )

    class Meta:
        model = DailyLog
        fields = (
            "id",
            "project",
            "log_date",
            "title",
            "description",
            "progress_percent",
            "issue_notes",
            "weather_notes",
            "created_by",
            "created_by_name",
            "created_at",
        )

        read_only_fields = (
            "project",          # IMPORTANT
            "created_by",
            "created_by_name",
            "created_at",
        )
class ProjectSerializer(serializers.ModelSerializer):
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "code",
            "client_name",
            "location",
            "description",
            "start_date",
            "end_date",
            "status",
            "estimated_budget",
            "estimated_revenue",
            "project_type",
            "created_by",
            "created_at",
            "updated_at",
            "members",
        )
        read_only_fields = ("created_by", "created_at", "updated_at")
