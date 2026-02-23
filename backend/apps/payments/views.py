"""
Payment API Views
Handles payment initiation, status checking, and SSLCOMMERZ callbacks
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.utils import timezone
from django.db import transaction as db_transaction
import logging
from typing import Any, cast

from .models import Payment, PromotionPackage, PaymentLog
from .serializers import (
    PaymentListSerializer,
    PaymentDetailSerializer,
    InitiatePaymentSerializer,
    PaymentStatusSerializer,
    PaymentCallbackSerializer,
    PromotionPackageSerializer,
)
from apps.core.services import Services, SSLCommerzServices
from apps.core.permissions import IsRecruiter
from apps.jobs.models import Job

logger = logging.getLogger(__name__)


class PromotionPackageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for promotion packages
    - Recruiters can view available packages
    - No write access (packages managed by admin)
    """

    queryset = PromotionPackage.objects.filter(is_active=True)
    serializer_class = PromotionPackageSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def active_packages(self, request):
        """Get all active promotion packages"""
        packages = PromotionPackage.objects.filter(is_active=True).order_by("price")
        serializer = PromotionPackageSerializer(packages, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for payment management
    - Recruiters can initiate payments and check status
    - System processes SSLCOMMERZ callbacks
    """

    queryset = Payment.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "job_id", "recruiter_id"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return different serializer based on action"""
        if self.action == "retrieve":
            return PaymentDetailSerializer
        elif self.action == "initiate_payment":
            return InitiatePaymentSerializer
        elif self.action == "check_status":
            return PaymentStatusSerializer
        elif self.action == "ipn_callback":
            return PaymentCallbackSerializer
        else:
            return PaymentListSerializer

    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user

        # Recruiters see their own payments
        if Services.user_role(user) == "recruiter":
            return Payment.objects.filter(recruiter=user)

        # Admins see all payments (if is_staff)
        if user.is_staff:
            return Payment.objects.all()

        # Others see nothing
        return Payment.objects.none()

    def get_permissions(self):
        """Override permissions based on action"""
        if self.action == "ipn_callback":
            # IPN callback from SSLCOMMERZ (no auth needed)
            permission_classes = [AllowAny]
        elif self.action in ["initiate_payment", "check_status", "my_payments"]:
            # Recruiter-only actions
            permission_classes = [IsAuthenticated, IsRecruiter]
        else:
            # Default to authenticated
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """List payments (recruiter sees own, staff sees all)"""
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """Get payment details"""
        payment = self.get_object()

        # Check permission
        if payment.recruiter != request.user and not request.user.is_staff:
            return Response(
                {"error": "You do not have permission to view this payment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(payment)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def initiate_payment(self, request):
        """
        Initiate a new payment for job promotion

        Request body:
        {
            "job_id": 5,
            "package_id": 1  // Optional
        }
        """
        serializer = InitiatePaymentSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        validated_data = cast(dict[str, Any], serializer.validated_data)

        # Check recruiter permission
        if request.user.role != "recruiter":
            return Response(
                {"error": "Only recruiters can promote jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            job_id = validated_data["job_id"]
            package_id = validated_data.get("package_id")

            job = Job.objects.get(id=job_id)

            # Get package (use default or specified)
            if package_id:
                package = PromotionPackage.objects.get(id=package_id, is_active=True)
            else:
                # Use cheapest package as default
                package = (
                    PromotionPackage.objects.filter(is_active=True)
                    .order_by("price")
                    .first()
                )

                if not package:
                    return Response(
                        {"error": "No promotion packages available."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Create payment record
            with db_transaction.atomic():
                transaction_id = SSLCommerzServices.generate_transaction_id()

                payment = Payment.objects.create(
                    recruiter=request.user,
                    job=job,
                    amount=package.price,
                    currency="BDT",
                    transaction_id=transaction_id,
                    promotion_duration_days=package.duration_days,
                    status="initiated",
                )

                # Initiate payment with SSLCOMMERZ
                ssl_service = SSLCommerzServices()
                init_result = ssl_service.initiate_payment(payment, request)

                if not init_result["success"]:
                    return Response(
                        {"error": init_result["error"]},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                return Response(
                    {
                        "message": "Payment initiated successfully",
                        "payment_id": payment.id,
                        "transaction_id": payment.transaction_id,
                        "redirect_url": init_result["redirect_url"],
                        "amount": str(payment.amount),
                        "currency": payment.currency,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            logger.error(f"Error initiating payment: {str(e)}")
            return Response(
                {"error": f"Error initiating payment: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def check_status(self, request):
        """
        Check payment status

        Request body:
        {
            "transaction_id": "JOB-XXXXX-123456"
        }
        """
        serializer = PaymentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = cast(dict[str, Any], serializer.validated_data)

        transaction_id = validated_data["transaction_id"]
        payment = Payment.objects.get(transaction_id=transaction_id)

        # Check permission
        if payment.recruiter != request.user and not request.user.is_staff:
            return Response(
                {"error": "You do not have permission to view this payment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(PaymentDetailSerializer(payment).data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_payments(self, request):
        """Get all payments by current recruiter"""
        if request.user.role != "recruiter":
            return Response(
                {"error": "Only recruiters can view payment history."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payments = Payment.objects.filter(recruiter=request.user).order_by(
            "-created_at"
        )

        # Apply filters
        status_filter = request.query_params.get("status")
        if status_filter:
            payments = payments.filter(status=status_filter)

        # Pagination
        page = request.query_params.get("page", 1)
        per_page = int(request.query_params.get("per_page", 10))

        start = (int(page) - 1) * per_page
        end = start + per_page

        serializer = PaymentListSerializer(payments[start:end], many=True)

        return Response(
            {
                "count": payments.count(),
                "page": page,
                "per_page": per_page,
                "results": serializer.data,
            }
        )

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="ipn-callback",
    )
    def ipn_callback(self, request):
        """
        SSLCOMMERZ IPN Callback Handler
        Receives payment status from SSLCOMMERZ
        """
        try:
            callback_data = request.data

            logger.info(f"IPN Callback received: {callback_data}")

            # Validate callback data
            serializer = PaymentCallbackSerializer(data=callback_data)
            serializer.is_valid(raise_exception=True)
            validated_data = cast(dict[str, Any], serializer.validated_data)

            transaction_id = validated_data["tran_id"]

            # Get payment
            try:
                payment = Payment.objects.get(transaction_id=transaction_id)
            except Payment.DoesNotExist:
                logger.warning(f"Payment not found for transaction: {transaction_id}")
                return Response(
                    {"error": "Payment not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Process callback
            ssl_service = SSLCommerzServices()
            process_result = ssl_service.process_callback(
                callback_data,
                payment,
                request,
            )

            if process_result["success"]:
                return Response(
                    {"message": process_result["message"]},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": process_result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            logger.error(f"Error processing IPN callback: {str(e)}")
            return Response(
                {"error": "Error processing callback"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated],
    )
    def logs(self, request, pk=None):
        """Get payment logs for audit trail"""
        payment = self.get_object()

        # Check permission
        if payment.recruiter != request.user and not request.user.is_staff:
            return Response(
                {"error": "You do not have permission to view this payment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        logs = PaymentLog.objects.filter(payment=payment).order_by("-created_at")

        from .serializers import PaymentLogSerializer

        serializer = PaymentLogSerializer(logs, many=True)

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
    )
    def promotion_status(self, request):
        """
        Get promotion status for recruiter's jobs
        Shows which jobs are currently promoted and until when
        """
        if request.user.role != "recruiter":
            return Response(
                {"error": "Only recruiters can view promotion status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from apps.jobs.models import Job

        jobs = Job.objects.filter(recruiter=request.user)

        promotion_data = []
        for job in jobs:
            if job.is_promoted and job.promoted_until:
                is_active = timezone.now() < job.promoted_until
            else:
                is_active = False

            # Get latest payment for this job
            latest_payment = (
                Payment.objects.filter(job=job, status="completed")
                .order_by("-completed_at")
                .first()
            )

            promotion_data.append(
                {
                    "job_id": job.pk,
                    "job_title": job.title,
                    "is_promoted": is_active,
                    "promoted_until": job.promoted_until,
                    "last_payment_date": (
                        latest_payment.completed_at if latest_payment else None
                    ),
                }
            )

        return Response(promotion_data)
