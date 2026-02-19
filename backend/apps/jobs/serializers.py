from rest_framework import serializers
from apps.jobs.models import Job


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = (
            "id",
            "recruiter",
            "category",
            "title",
            "description",
            "company_name",
            "location",
            "employment_type",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("recruiter", "created_at", "updated_at")
