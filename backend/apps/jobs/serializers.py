from rest_framework import serializers
from apps.jobs.models import Job


class JobListSerializer(serializers.ModelSerializer):
    """Serializer for job list view (read-only)"""

    recruiter_name = serializers.CharField(source="recruiter.full_name", read_only=True)
    company_logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            "id",
            "title",
            "company_name",
            "company_logo_url",
            "location",
            "job_type",
            "category",
            "salary",
            "recruiter_name",
            "created_at",
        )

    def get_company_logo_url(self, obj):
        """Return company logo URL"""
        if obj.company_logo:
            return (
                obj.company_logo.url
                if hasattr(obj.company_logo, "url")
                else str(obj.company_logo)
            )
        return None


class JobDetailSerializer(serializers.ModelSerializer):
    """Serializer for job detail view (full details)"""

    recruiter_name = serializers.CharField(source="recruiter.full_name", read_only=True)
    recruiter_email = serializers.CharField(source="recruiter.email", read_only=True)
    company_logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            "id",
            "title",
            "description",
            "requirements",
            "location",
            "job_type",
            "category",
            "salary",
            "experience_required",
            "position_count",
            "company_name",
            "company_logo_url",
            "application_deadline",
            "recruiter_name",
            "recruiter_email",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def get_company_logo_url(self, obj):
        """Return company logo URL"""
        if obj.company_logo:
            return (
                obj.company_logo.url
                if hasattr(obj.company_logo, "url")
                else str(obj.company_logo)
            )
        return None


class JobCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating jobs (recruiter only)"""

    class Meta:
        model = Job
        fields = (
            "title",
            "description",
            "requirements",
            "location",
            "job_type",
            "category",
            "salary",
            "experience_required",
            "position_count",
            "company_name",
            "company_logo",
            "application_deadline",
        )

    def validate_salary(self, value):
        """Validate salary is positive if provided"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Salary must be greater than 0")
        return value

    def validate_experience_required(self, value):
        """Validate experience is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Experience required cannot be negative")
        return value

    def validate_position_count(self, value):
        """Validate position count is positive"""
        if value <= 0:
            raise serializers.ValidationError("Position count must be at least 1")
        return value
