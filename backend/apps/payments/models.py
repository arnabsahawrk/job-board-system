"""
Payment Models for SSLCOMMERZ Integration
Handles job promotion payments and transaction history
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone
from apps.jobs.models import Job

User = get_user_model()


class Payment(models.Model):
    """Store payment transactions and promotion history"""

    STATUS_CHOICES = (
        ("initiated", "Initiated"),  # Payment form created, waiting for user action
        ("pending", "Pending"),  # Payment submitted, validation in progress
        ("completed", "Completed"),  # Successfully validated
        ("failed", "Failed"),  # Validation failed or user cancelled
        ("refunded", "Refunded"),  # Payment refunded
    )

    # Primary Key
    id = models.AutoField(primary_key=True)

    # User & Job
    recruiter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="job_promotion_payments",
        help_text="Recruiter making the payment",
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="promotion_payments",
        help_text="Job post being promoted",
    )

    # Payment Details
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text="Payment amount in base currency",
    )
    currency = models.CharField(
        max_length=3,
        default="BDT",
        help_text="Currency code (BDT for Bangladesh)",
    )

    # SSLCOMMERZ Transaction Data
    store_id = models.CharField(
        max_length=50,
        blank=True,
        help_text="SSLCOMMERZ Store ID",
    )
    transaction_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique transaction reference ID",
    )
    validation_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="SSLCOMMERZ validation reference",
    )

    # Payment Gateway Response
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="initiated",
        help_text="Current payment status",
    )
    gateway_response = models.JSONField(
        default=dict,
        blank=True,
        help_text="Full response from SSLCOMMERZ API",
    )
    error_message = models.TextField(
        blank=True,
        help_text="Error details if payment failed",
    )

    # Promotion Status
    is_job_promoted = models.BooleanField(
        default=False,
        help_text="Whether job post is promoted after payment",
    )
    promotion_duration_days = models.IntegerField(
        default=30,
        validators=[MinValueValidator(1)],
        help_text="Days the job remains promoted",
    )
    promoted_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the promotion expires",
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Payment initiation time",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Last update time",
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When payment was completed",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recruiter", "-created_at"]),
            models.Index(fields=["transaction_id"]),
            models.Index(fields=["job", "status"]),
        ]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"Payment {self.transaction_id} - {self.status}"

    def mark_as_completed(self, validation_response=None):
        """Mark payment as completed and promote job"""
        self.status = "completed"
        self.completed_at = timezone.now()

        if validation_response:
            self.gateway_response = validation_response
            self.validation_id = validation_response.get("status")

        # Set promotion expiry
        self.is_job_promoted = True
        self.promoted_until = timezone.now() + timezone.timedelta(
            days=self.promotion_duration_days
        )

        # Update job promotion status
        self.job.is_promoted = True
        self.job.promoted_until = self.promoted_until
        self.job.save()

        self.save()

    def mark_as_failed(self, error_message=""):
        """Mark payment as failed"""
        self.status = "failed"
        self.error_message = error_message
        self.is_job_promoted = False
        self.save()

    def get_promotion_status(self):
        """Check if promotion is still active"""
        if not self.is_job_promoted:
            return False

        if self.promoted_until and timezone.now() > self.promoted_until:
            # Promotion expired
            self.is_job_promoted = False
            self.job.is_promoted = False
            self.job.save()
            self.save()
            return False

        return True


class PromotionPackage(models.Model):
    """Predefined promotion packages with pricing"""

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Package name (e.g., 'Basic', 'Premium')",
    )
    description = models.TextField(
        help_text="Package description and benefits",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text="Package price in base currency",
    )
    duration_days = models.IntegerField(
        default=30,
        validators=[MinValueValidator(1)],
        help_text="How many days the promotion lasts",
    )
    featured_position = models.IntegerField(
        default=3,
        help_text="Display priority in job listings (lower = higher priority)",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this package is available for purchase",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["price"]
        verbose_name_plural = "Promotion Packages"

    def __str__(self):
        return f"{self.name} - {self.price} BDT ({self.duration_days} days)"


class PaymentLog(models.Model):
    """Audit log for all payment operations"""

    ACTION_CHOICES = (
        ("initiated", "Payment Initiated"),
        ("redirect_sent", "User Redirected to SSLCOMMERZ"),
        ("callback_received", "Callback Received from SSLCOMMERZ"),
        ("validation_started", "Validation Started"),
        ("validation_success", "Validation Successful"),
        ("validation_failed", "Validation Failed"),
        ("job_promoted", "Job Promoted"),
        ("error_occurred", "Error Occurred"),
    )

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name="logs",
        help_text="Associated payment",
    )
    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES,
        help_text="Action performed",
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional details about the action",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address from which action was initiated",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Payment Logs"

    def __str__(self):
        return f"{self.payment.transaction_id} - {self.action}"
