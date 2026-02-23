"""
Payment Serializers for REST API
Handles payment creation, validation, and display
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Payment, PromotionPackage, PaymentLog


class PromotionPackageSerializer(serializers.ModelSerializer):
    """Serializer for promotion packages"""

    class Meta:
        model = PromotionPackage
        fields = (
            "id",
            "name",
            "description",
            "price",
            "duration_days",
            "featured_position",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "id")


class PaymentLogSerializer(serializers.ModelSerializer):
    """Serializer for payment audit logs"""

    action_display = serializers.CharField(
        source="get_action_display",
        read_only=True,
    )

    class Meta:
        model = PaymentLog
        fields = (
            "id",
            "action",
            "action_display",
            "details",
            "ip_address",
            "created_at",
        )
        read_only_fields = fields


class PaymentListSerializer(serializers.ModelSerializer):
    """Serializer for payment list view"""

    recruiter_name = serializers.CharField(
        source="recruiter.full_name",
        read_only=True,
    )
    job_title = serializers.CharField(
        source="job.title",
        read_only=True,
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Payment
        fields = (
            "id",
            "transaction_id",
            "recruiter_name",
            "job_title",
            "amount",
            "currency",
            "status",
            "status_display",
            "is_job_promoted",
            "created_at",
            "completed_at",
        )
        read_only_fields = fields


class PaymentDetailSerializer(serializers.ModelSerializer):
    """Serializer for payment detail view with full information"""

    recruiter_name = serializers.CharField(
        source="recruiter.full_name",
        read_only=True,
    )
    recruiter_email = serializers.CharField(
        source="recruiter.email",
        read_only=True,
    )
    job_title = serializers.CharField(
        source="job.title",
        read_only=True,
    )
    job_company = serializers.CharField(
        source="job.company_name",
        read_only=True,
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    logs = PaymentLogSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id",
            "transaction_id",
            "recruiter_name",
            "recruiter_email",
            "job_title",
            "job_company",
            "amount",
            "currency",
            "status",
            "status_display",
            "is_job_promoted",
            "promotion_duration_days",
            "promoted_until",
            "error_message",
            "created_at",
            "completed_at",
            "updated_at",
            "logs",
        )
        read_only_fields = fields


class InitiatePaymentSerializer(serializers.Serializer):
    """
    Serializer for initiating payment
    Receives job_id and optional package_id
    """

    job_id = serializers.IntegerField(
        required=True,
        help_text="ID of the job to promote",
    )
    package_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Optional: ID of promotion package. If not provided, default will be used.",
    )

    def validate_job_id(self, value):
        """Validate job exists and belongs to current recruiter"""
        from apps.jobs.models import Job

        try:
            job = Job.objects.get(id=value)
        except Job.DoesNotExist:
            raise serializers.ValidationError("Job not found.")

        # Check if user is the recruiter
        request = self.context.get("request")
        if request and job.recruiter != request.user:
            raise serializers.ValidationError("You can only promote your own jobs.")

        return value

    def validate_package_id(self, value):
        """Validate package exists and is active"""
        if value is None:
            return value

        try:
            PromotionPackage.objects.get(
                id=value,
                is_active=True,
            )
        except PromotionPackage.DoesNotExist:
            raise serializers.ValidationError(
                "Promotion package not found or is inactive."
            )

        return value

    def validate(self, data):
        """Additional cross-field validation"""
        from apps.jobs.models import Job

        job_id = data.get("job_id")
        job = Job.objects.get(id=job_id)

        # Check if job is already promoted and promotion is still active
        if job.is_promoted and job.promoted_until:
            if timezone.now() < job.promoted_until:
                raise serializers.ValidationError(
                    {
                        "job_id": "This job is already promoted. Promotion expires at "
                        + job.promoted_until.strftime("%Y-%m-%d %H:%M:%S")
                    }
                )

        return data


class PaymentStatusSerializer(serializers.Serializer):
    """Serializer for checking payment status"""

    transaction_id = serializers.CharField(
        required=True,
        help_text="Payment transaction ID to check status",
    )

    def validate_transaction_id(self, value):
        """Validate transaction exists"""
        try:
            Payment.objects.get(transaction_id=value)
        except Payment.DoesNotExist:
            raise serializers.ValidationError("Transaction not found.")
        return value


class PaymentCallbackSerializer(serializers.Serializer):
    """Serializer for SSLCOMMERZ callback data"""

    tran_id = serializers.CharField(required=True)
    val_id = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=True)
    currency = serializers.CharField(required=False)
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
    )
    card_type = serializers.CharField(required=False, allow_blank=True)
    card_no = serializers.CharField(required=False, allow_blank=True)
    card_issuer = serializers.CharField(required=False, allow_blank=True)
    error_description = serializers.CharField(required=False, allow_blank=True)

    def validate_tran_id(self, value):
        """Validate transaction exists"""
        try:
            Payment.objects.get(transaction_id=value)
        except Payment.DoesNotExist:
            raise serializers.ValidationError("Transaction not found.")
        return value


class RefundPaymentSerializer(serializers.Serializer):
    """Serializer for refund request (future enhancement)"""

    payment_id = serializers.IntegerField(required=True)
    reason = serializers.CharField(
        required=True,
        max_length=500,
        help_text="Reason for refund",
    )

    def validate_payment_id(self, value):
        """Validate payment exists and is refundable"""
        try:
            payment = Payment.objects.get(id=value)
        except Payment.DoesNotExist:
            raise serializers.ValidationError("Payment not found.")

        if payment.status != "completed":
            raise serializers.ValidationError(
                "Only completed payments can be refunded."
            )

        if payment.status == "refunded":
            raise serializers.ValidationError("This payment has already been refunded.")

        return value
