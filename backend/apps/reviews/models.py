from django.db import models
from apps.jobs.models import Job
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()


class Review(models.Model):

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="reviews")

    recruiter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_reviews",
    )

    reviewer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="given_reviews"
    )

    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    comment = models.TextField(max_length=1000, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("job", "reviewer")

    def __str__(self):
        return f"Review for {self.recruiter.email}"
