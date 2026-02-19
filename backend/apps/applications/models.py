from django.db import models
from apps.jobs.models import Job
from django.core.validators import FileExtensionValidator
from apps.core.validators import validate_file_size
from django.contrib.auth import get_user_model

User = get_user_model()


class Application(models.Model):

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("reviewed", "Reviewed"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    )

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")

    applicant = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="applications"
    )

    resume = models.FileField(
        upload_to="applications/resumes/",
        validators=[
            FileExtensionValidator(allowed_extensions=["pdf"]),
            validate_file_size,
        ],
    )
    cover_letter = models.TextField(blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("job", "applicant")

    def __str__(self):
        return f"{self.applicant.email} - {self.job.title}"


class ApplicationFeedback(models.Model):
    """Store feedback when recruiter updates application status"""

    application = models.OneToOneField(
        Application, on_delete=models.CASCADE, related_name="feedback"
    )
    recruiter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="given_feedbacks"
    )
    feedback_text = models.TextField(max_length=1000)
    status_given = models.CharField(max_length=20)  # Status when feedback was given
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Application Feedbacks"

    def __str__(self):
        return f"Feedback for {self.application.applicant.email} - {self.status_given}"
