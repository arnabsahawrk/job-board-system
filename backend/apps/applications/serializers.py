from rest_framework import serializers
from django.core.exceptions import ObjectDoesNotExist
from apps.applications.models import Application, ApplicationFeedback
from apps.core.validators import validate_file_size
from apps.jobs.serializers import JobListSerializer
from apps.jobs.models import Job


class ApplicationListSerializer(serializers.ModelSerializer):
    """Serializer for application list view"""

    job_title = serializers.CharField(source="job.title", read_only=True)
    job_company = serializers.CharField(source="job.company_name", read_only=True)
    applicant_name = serializers.CharField(source="applicant.full_name", read_only=True)
    applicant_email = serializers.CharField(source="applicant.email", read_only=True)

    class Meta:
        model = Application
        fields = (
            "id",
            "job",
            "job_title",
            "job_company",
            "applicant_name",
            "applicant_email",
            "status",
            "applied_at",
            "updated_at",
        )
        read_only_fields = ("applied_at", "updated_at", "id")


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """Serializer for application detail view"""

    job = JobListSerializer(read_only=True)
    applicant_name = serializers.CharField(source="applicant.full_name", read_only=True)
    applicant_email = serializers.CharField(source="applicant.email", read_only=True)
    applicant_phone = serializers.SerializerMethodField()
    applicant_bio = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            "id",
            "job",
            "applicant_name",
            "applicant_email",
            "applicant_phone",
            "applicant_bio",
            "resume",
            "cover_letter",
            "status",
            "applied_at",
            "updated_at",
        )
        read_only_fields = ("applied_at", "updated_at", "id", "job")

    def get_applicant_phone(self, obj):
        """Get applicant phone from profile"""
        try:
            return obj.applicant.profile.phone_number
        except (AttributeError, ObjectDoesNotExist):
            return None

    def get_applicant_bio(self, obj):
        """Get applicant bio from profile"""
        try:
            return obj.applicant.profile.bio
        except (AttributeError, ObjectDoesNotExist):
            return None


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating applications (job seekers only)"""

    job_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Application
        fields = (
            "job_id",
            "resume",
            "cover_letter",
        )

    def validate_job_id(self, value):
        """Validate job exists"""

        try:
            Job.objects.get(id=value)
        except Job.DoesNotExist:
            raise serializers.ValidationError("Job not found")
        return value

    def validate_resume(self, value):
        """Validate resume file"""
        if not value:
            raise serializers.ValidationError("Resume is required")

        # Check file size
        validate_file_size(value)

        # Check file extension
        allowed_extensions = ["pdf", "doc", "docx"]
        file_name = value.name.lower()
        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                "Resume must be a document file (PDF, DOC, DOCX)"
            )

        return value

    def create(self, validated_data):
        """Create application with applicant from request"""

        job_id = validated_data.pop("job_id")
        job = Job.objects.get(id=job_id)
        applicant = self.context["request"].user

        # Check if already applied
        if Application.objects.filter(job=job, applicant=applicant).exists():
            raise serializers.ValidationError("You have already applied to this job")

        application = Application.objects.create(
            job=job, applicant=applicant, **validated_data
        )
        return application


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating application status (recruiters only)"""

    class Meta:
        model = Application
        fields = ("status",)

    def validate_status(self, value):
        """Validate status is valid choice"""
        valid_statuses = [choice[0] for choice in Application.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        return value


class ApplicationFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for application feedback"""

    recruiter_name = serializers.CharField(source="recruiter.full_name", read_only=True)
    recruiter_email = serializers.CharField(source="recruiter.email", read_only=True)
    applicant_name = serializers.CharField(
        source="application.applicant.full_name", read_only=True
    )
    applicant_email = serializers.CharField(
        source="application.applicant.email", read_only=True
    )
    job_title = serializers.CharField(source="application.job.title", read_only=True)

    class Meta:
        model = ApplicationFeedback
        fields = (
            "id",
            "application",
            "recruiter_name",
            "recruiter_email",
            "applicant_name",
            "applicant_email",
            "job_title",
            "feedback_text",
            "status_given",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "created_at",
            "updated_at",
            "id",
            "recruiter",
            "status_given",
        )


class ApplicationFeedbackCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating application feedback when updating status"""

    feedback_text = serializers.CharField(required=True, max_length=1000)

    class Meta:
        model = ApplicationFeedback
        fields = ("feedback_text",)

    def validate_feedback_text(self, value):
        """Validate feedback text"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Feedback cannot be empty")
        if len(value) > 1000:
            raise serializers.ValidationError(
                "Feedback must be less than 1000 characters"
            )
        return value


class ApplicationFeedbackListSerializer(serializers.ModelSerializer):
    """Serializer for listing application feedbacks"""

    recruiter_name = serializers.CharField(source="recruiter.full_name", read_only=True)
    applicant_name = serializers.CharField(
        source="application.applicant.full_name", read_only=True
    )
    job_title = serializers.CharField(source="application.job.title", read_only=True)

    class Meta:
        model = ApplicationFeedback
        fields = (
            "id",
            "recruiter_name",
            "applicant_name",
            "job_title",
            "feedback_text",
            "status_given",
            "created_at",
        )
        read_only_fields = ("created_at", "id")
