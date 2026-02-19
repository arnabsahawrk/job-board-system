from rest_framework import serializers
from apps.reviews.models import Review, ReviewHelpful
from apps.jobs.serializers import JobListSerializer
from apps.jobs.models import Job
from apps.applications.models import Application


class ReviewListSerializer(serializers.ModelSerializer):
    """Serializer for review list view"""

    recruiter_name = serializers.CharField(source="recruiter.full_name", read_only=True)
    recruiter_email = serializers.CharField(source="recruiter.email", read_only=True)
    reviewer_name = serializers.CharField(source="reviewer.full_name", read_only=True)
    reviewer_email = serializers.CharField(source="reviewer.email", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "job",
            "job_title",
            "recruiter_name",
            "recruiter_email",
            "reviewer_name",
            "reviewer_email",
            "rating",
            "created_at",
        )
        read_only_fields = ("created_at", "id")


class ReviewDetailSerializer(serializers.ModelSerializer):
    """Serializer for review detail view"""

    recruiter_name = serializers.CharField(source="recruiter.full_name", read_only=True)
    recruiter_email = serializers.CharField(source="recruiter.email", read_only=True)
    reviewer_name = serializers.CharField(source="reviewer.full_name", read_only=True)
    reviewer_email = serializers.CharField(source="reviewer.email", read_only=True)
    job = JobListSerializer(read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "job",
            "recruiter_name",
            "recruiter_email",
            "reviewer_name",
            "reviewer_email",
            "rating",
            "comment",
            "created_at",
        )
        read_only_fields = ("created_at", "id", "recruiter", "reviewer", "job")


class ReviewCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating reviews (job seekers only)"""

    job_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Review
        fields = (
            "job_id",
            "rating",
            "comment",
        )

    def validate_job_id(self, value):
        """Validate job exists"""

        try:
            Job.objects.get(id=value)
        except Job.DoesNotExist:
            raise serializers.ValidationError("Job not found")
        return value

    def validate_rating(self, value):
        """Validate rating is between 1 and 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def validate_comment(self, value):
        """Validate comment length"""
        if value and len(value) > 1000:
            raise serializers.ValidationError(
                "Comment must be less than 1000 characters"
            )
        return value

    def validate(self, data):
        """Check if user has applied to this job and hasn't reviewed yet"""

        job_id = data.get("job_id")
        job = Job.objects.get(id=job_id)
        reviewer = self.context["request"].user

        # Check if user has applied to this job
        application = Application.objects.filter(job=job, applicant=reviewer).first()

        if not application:
            raise serializers.ValidationError(
                "You must apply to a job before reviewing it"
            )

        # Check if already reviewed
        if Review.objects.filter(job=job, reviewer=reviewer).exists():
            raise serializers.ValidationError("You have already reviewed this job")

        return data

    def create(self, validated_data):
        """Create review with reviewer and recruiter from job"""

        job_id = validated_data.pop("job_id")
        job = Job.objects.get(id=job_id)
        reviewer = self.context["request"].user

        review = Review.objects.create(
            job=job, recruiter=job.recruiter, reviewer=reviewer, **validated_data
        )
        return review


class ReviewStatisticsSerializer(serializers.Serializer):
    """Serializer for review statistics"""

    total_reviews = serializers.IntegerField()
    average_rating = serializers.FloatField()
    five_star = serializers.IntegerField()
    four_star = serializers.IntegerField()
    three_star = serializers.IntegerField()
    two_star = serializers.IntegerField()
    one_star = serializers.IntegerField()


class ReviewHelpfulSerializer(serializers.ModelSerializer):
    """Serializer for review helpful votes"""

    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = ReviewHelpful
        fields = (
            "id",
            "review",
            "user_name",
            "user_email",
            "created_at",
        )
        read_only_fields = ("created_at", "id")
