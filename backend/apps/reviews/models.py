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


class ReviewHelpful(models.Model):
    """Track helpful votes on reviews"""

    review = models.ForeignKey(
        Review, on_delete=models.CASCADE, related_name="helpful_votes"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="helpful_reviews"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("review", "user")
        verbose_name_plural = "Review Helpful Votes"

    def __str__(self):
        return f"{self.user.email} marked review {self.review.pk} as helpful"
