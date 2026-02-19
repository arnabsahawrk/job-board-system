from django.db import models
from django.contrib.auth import get_user_model

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
    company_logo = models.ImageField(
        blank=True,
        null=True,
        upload_to="company_logos/",
    )

    application_deadline = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
