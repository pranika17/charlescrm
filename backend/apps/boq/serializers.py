from rest_framework import serializers
from .models import BOQ


class BOQSerializer(serializers.ModelSerializer):

    total_cost = serializers.ReadOnlyField()
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = BOQ
        fields = "__all__"

    def validate(self, attrs):
        project = attrs.get("project") or getattr(self.instance, "project", None)
        if project is None:
            raise serializers.ValidationError({"project": "Choose a project before saving BOQ."})
        return attrs
