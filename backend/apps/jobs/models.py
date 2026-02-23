from django.db import models
from cloudinary.models import CloudinaryField
from django.contrib.auth import get_user_model

# from django.core.validators import FileExtensionValidator
# from apps.core.validators import validate_file_size

User = get_user_model()


class Job(models.Model):

    JOB_TYPE_CHOICES = (
        ("full_time", "Full-time"),
        ("part_time", "Part-time"),
        ("remote", "Remote"),
        ("contract", "Contract"),
        ("internship", "Internship"),
    )

    CATEGORY_CHOICES = (
        ("it", "IT"),
        ("healthcare", "Healthcare"),
        ("finance", "Finance"),
        ("education", "Education"),
        ("marketing", "Marketing"),
        ("design", "Design"),
        ("other", "Other"),
    )

    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="jobs")

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)

    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField()
    location = models.CharField(max_length=255)

    job_type = models.CharField(max_length=50, choices=JOB_TYPE_CHOICES)

    salary = models.PositiveIntegerField(blank=True, null=True)

    experience_required = models.PositiveIntegerField(default=0)
    position_count = models.PositiveIntegerField(default=1)

    company_name = models.CharField(max_length=255)

    company_logo = CloudinaryField(
        "image",
        blank=True,
        null=True,
        folder="jobs/company_logos/",
        help_text="Company logo image (JPG, PNG, JPEG)",
    )

    # company_logo = models.ImageField(
    #     blank=True,
    #     null=True,
    #     upload_to="company_logos/",
    #     validators=[
    #         FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png"]),
    #         validate_file_size,
    #     ],
    # )

    application_deadline = models.DateTimeField(blank=True, null=True)

    is_promoted = models.BooleanField(
        default=False,
        help_text="Whether job post is currently promoted",
    )
    promoted_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When promotion expires",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
