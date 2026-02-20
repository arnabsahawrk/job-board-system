from rest_framework import serializers
from apps.core.validators import validate_file_size
from apps.jobs.models import Job


class JobListSerializer(serializers.ModelSerializer):
    """Serializer for job list view (read-only)"""

    recruiter_name = serializers.CharField(source="recruiter.full_name", read_only=True)

    class Meta:
        model = Job
        fields = (
            "id",
            "title",
            "company_name",
            "company_logo",
            "location",
            "job_type",
            "category",
            "salary",
            "recruiter_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("company_logo", "created_at", "updated_at")


class JobDetailSerializer(serializers.ModelSerializer):
    """Serializer for job detail view (full details)"""

    recruiter_name = serializers.CharField(source="recruiter.full_name", read_only=True)
    recruiter_email = serializers.CharField(source="recruiter.email", read_only=True)

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
            "company_logo",
            "application_deadline",
            "recruiter_name",
            "recruiter_email",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("company_logo", "created_at", "updated_at")


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

    def validate_company_logo(self, value):
        """Validate company logo file if provided"""
        if value is None:
            return value

        # Check file size
        validate_file_size(value)

        # Check file extension
        allowed_extensions = ["jpg", "jpeg", "png"]
        file_name = value.name.lower()
        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                "Company logo must be an image file (JPG, PNG, JPEG)"
            )

        return value
