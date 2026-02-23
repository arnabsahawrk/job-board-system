import uuid
from django.core.mail import send_mail
from django.template.loader import render_to_string
from apps.authentication.models import EmailVerification
from django.conf import settings
import requests
from django.utils import timezone
from django.db import transaction as db_transaction
import logging
from apps.payments.models import PaymentLog

logger = logging.getLogger(__name__)


class Services:
    """Services for common operations"""

    @staticmethod
    def user_role(user):
        """Safely return user role for typed request.user access."""
        return getattr(user, "role", None)


class EmailServices:
    """Service for sending various types of emails using Django Anymail + Brevo"""

    @staticmethod
    def send_verification_email(user, frontend_url=None):
        """
        Send verification email via Django Anymail + Brevo

        Args:
            user: User instance to send verification email to
            frontend_url: Optional frontend URL (uses FRONTEND_URL env var if not provided)

        Returns:
            bool: True if email sent successfully, False otherwise
        """

        if frontend_url is None:
            frontend_url = settings.FRONTEND_URL

        # Generate verification token
        token = str(uuid.uuid4())

        # Create or update verification record
        verification, created = EmailVerification.objects.update_or_create(
            user=user, defaults={"token": token, "is_verified": False}
        )

        # Build verification link
        verification_link = f"{frontend_url}/verify-email?token={token}"

        # Prepare email context
        context = {
            "user_name": user.full_name,
            "verification_link": verification_link,
            "token": token,
        }

        try:
            # Render HTML email from template
            html_message = render_to_string("emails/verify_email.html", context)
            plain_message = render_to_string("emails/verify_email.txt", context)

            # Send email
            send_mail(
                subject="Verify Your Email - Jobly",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"Verification email sent with token: {token}")
            return True

        except Exception as e:
            print(f"Email send error: {str(e)}")
            return False

    @staticmethod
    def send_password_reset_email(user, reset_link, frontend_url=None):
        """
        Send password reset email via Django Anymail + Brevo

        Args:
            user: User instance to send reset email to
            reset_link: Full reset link from frontend
            frontend_url: Optional frontend URL (uses FRONTEND_URL env var if not provided)

        Returns:
            bool: True if email sent successfully, False otherwise
        """

        if frontend_url is None:
            frontend_url = settings.FRONTEND_URL

        # Prepare email context
        context = {
            "user_name": user.full_name,
            "reset_link": reset_link,
            "frontend_url": frontend_url,
        }

        try:
            # Render HTML email from template
            html_message = render_to_string("emails/password_reset.html", context)
            plain_message = render_to_string("emails/password_reset.txt", context)

            # Send email
            send_mail(
                subject="Reset Your Password - Jobly",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True

        except Exception as e:
            print(f"Email send error: {str(e)}")
            return False

    @staticmethod
    def send_welcome_email(user):
        """
        Send welcome email after successful registration

        Args:
            user: User instance to send welcome email to

        Returns:
            bool: True if email sent successfully, False otherwise
        """

        context = {
            "user_name": user.full_name,
            "user_role": user.get_role_display(),
        }

        try:
            html_message = render_to_string("emails/welcome.html", context)
            plain_message = render_to_string("emails/welcome.txt", context)

            send_mail(
                subject="Welcome to Jobly!",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True

        except Exception as e:
            print(f"Email send error: {str(e)}")
            return False

    @staticmethod
    def send_account_verified_email(user):
        """
        Send confirmation email after email verification

        Args:
            user: User instance whose email was verified

        Returns:
            bool: True if email sent successfully, False otherwise
        """

        context = {
            "user_name": user.full_name,
        }

        try:
            html_message = render_to_string("emails/account_verified.html", context)
            plain_message = render_to_string("emails/account_verified.txt", context)

            send_mail(
                subject="Email Verified - Jobly",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True

        except Exception as e:
            print(f"Email send error: {str(e)}")
            return False

    @staticmethod
    def send_bulk_email(recipients, subject, html_message, plain_message):
        """
        Send bulk email to multiple recipients

        Args:
            recipients: List of email addresses
            subject: Email subject
            html_message: HTML email content
            plain_message: Plain text email content

        Returns:
            bool: True if all emails sent successfully, False otherwise
        """

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                html_message=html_message,
                fail_silently=False,
            )
            return True

        except Exception as e:
            print(f"Bulk email send error: {str(e)}")
            return False

    @staticmethod
    def send_application_received_email(application):
        """
        Send email to job seeker confirming application was received.

        Args:
            application: Application instance
        """
        user = application.applicant
        job = application.job

        context = {
            "user_name": user.full_name,
            "job_title": job.title,
            "company_name": job.company_name,
            "application_date": application.applied_at,
        }

        try:
            html_message = render_to_string("emails/application_received.html", context)
            plain_message = render_to_string("emails/application_received.txt", context)

            send_mail(
                subject=f"Application Received - {job.title} at {job.company_name}",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True

        except Exception as e:
            print(f"Error sending application received email: {str(e)}")
            return False

    @staticmethod
    def send_new_application_notification(application):
        """
        Send email to recruiter notifying them of a new application.

        Args:
            application: Application instance
        """
        recruiter = application.job.recruiter
        applicant = application.applicant
        job = application.job

        context = {
            "recruiter_name": recruiter.full_name,
            "applicant_name": applicant.full_name,
            "applicant_email": applicant.email,
            "job_title": job.title,
            "application_date": application.applied_at,
        }

        try:
            html_message = render_to_string("emails/new_application.html", context)
            plain_message = render_to_string("emails/new_application.txt", context)

            send_mail(
                subject=f"New Application for {job.title}",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recruiter.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True

        except Exception as e:
            print(f"Error sending new application notification: {str(e)}")
            return False

    @staticmethod
    def send_application_status_update_email(application, feedback_text):
        """
        Send email to job seeker when application status is updated.

        Args:
            application: Application instance
            feedback_text: Feedback from recruiter
        """
        user = application.applicant
        job = application.job
        recruiter = job.recruiter

        status_display = {
            "pending": "Pending",
            "reviewed": "Reviewed",
            "accepted": "Accepted",
            "rejected": "Rejected",
        }.get(application.status, application.status)

        context = {
            "user_name": user.full_name,
            "job_title": job.title,
            "company_name": job.company_name,
            "recruiter_name": recruiter.full_name,
            "status": status_display,
            "feedback": feedback_text,
        }

        try:
            html_message = render_to_string(
                "emails/application_status_update.html", context
            )
            plain_message = render_to_string(
                "emails/application_status_update.txt", context
            )

            send_mail(
                subject=f"Application Status Update - {job.title}",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True

        except Exception as e:
            print(f"Error sending application status update email: {str(e)}")
            return False

    @staticmethod
    def send_application_accepted_email(application):
        """
        Send celebratory email when application is accepted.

        Args:
            application: Application instance
        """
        user = application.applicant
        job = application.job
        recruiter = job.recruiter

        context = {
            "user_name": user.full_name,
            "job_title": job.title,
            "company_name": job.company_name,
            "recruiter_name": recruiter.full_name,
            "recruiter_email": recruiter.email,
        }

        try:
            html_message = render_to_string("emails/application_accepted.html", context)
            plain_message = render_to_string("emails/application_accepted.txt", context)

            send_mail(
                subject=f"Congratulations! Your Application for {job.title} was Accepted!",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True

        except Exception as e:
            print(f"Error sending application accepted email: {str(e)}")
            return False

    @staticmethod
    def send_application_rejected_email(application, feedback_text):
        """
        Send email when application is rejected.

        Args:
            application: Application instance
            feedback_text: Feedback from recruiter
        """
        user = application.applicant
        job = application.job

        context = {
            "user_name": user.full_name,
            "job_title": job.title,
            "company_name": job.company_name,
            "feedback": feedback_text,
        }

        try:
            html_message = render_to_string("emails/application_rejected.html", context)
            plain_message = render_to_string("emails/application_rejected.txt", context)

            send_mail(
                subject=f"Application Update - {job.title} at {job.company_name}",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True

        except Exception as e:
            print(f"Error sending application rejected email: {str(e)}")
            return False


class SSLCommerzServices:
    """Service for SSLCOMMERZ payment gateway integration"""

    def __init__(self):
        """Initialize with SSLCOMMERZ credentials"""
        self.store_id = settings.SSLCOMMERZ_STORE_ID
        self.store_password = settings.SSLCOMMERZ_STORE_PASSWORD

        # SSLCOMMERZ endpoints
        if settings.SSLCOMMERZ_SANDBOX_MODE:
            self.api_url = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
            self.redirect_url = "https://sandbox.sslcommerz.com/customer/checkout.php"
            self.validation_url = "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"
        else:
            self.api_url = "https://api.sslcommerz.com/gwprocess/v4/api.php"
            self.redirect_url = "https://api.sslcommerz.com/customer/checkout.php"
            self.validation_url = "https://api.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"

    def initiate_payment(self, payment_obj, request):
        """
        Initiate payment by creating SSLCOMMERZ checkout session

        Args:
            payment_obj: Payment model instance
            request: HTTP request object (for getting user IP and other info)

        Returns:
            dict: Contains 'success' status and either 'redirect_url' or 'error'
        """
        try:
            # Prepare payment data
            payload = self._prepare_payload(payment_obj, request)

            # Send to SSLCOMMERZ
            logger.info(f"Initiating payment: {payment_obj.transaction_id}")
            response = requests.post(
                self.api_url,
                data=payload,
                timeout=10,
                verify=True,
            )
            response.raise_for_status()

            # Parse response
            response_data = (
                response.json()
                if response.headers.get("content-type") == "application/json"
                else {}
            )

            logger.info(f"SSLCOMMERZ response: {response_data}")

            if response_data.get("status") == "SUCCESS":
                # Update payment with gateway store ID
                payment_obj.store_id = response_data.get("store_id", "")
                payment_obj.gateway_response = response_data
                payment_obj.status = "pending"
                payment_obj.save()

                # Log the action
                self._log_payment_action(
                    payment_obj,
                    "redirect_sent",
                    {"gateway_response": response_data},
                    request,
                )

                return {
                    "success": True,
                    "redirect_url": response_data.get("GatewayPageURL"),
                    "session_id": response_data.get("sessionkey"),
                }
            else:
                error_msg = response_data.get(
                    "failedreason", "Unknown error from SSLCOMMERZ"
                )
                payment_obj.error_message = error_msg
                payment_obj.status = "failed"
                payment_obj.save()

                self._log_payment_action(
                    payment_obj,
                    "error_occurred",
                    {"error": error_msg},
                    request,
                )

                return {
                    "success": False,
                    "error": error_msg,
                }

        except requests.exceptions.RequestException as e:
            error_msg = f"Network error connecting to SSLCOMMERZ: {str(e)}"
            logger.error(error_msg)
            payment_obj.error_message = error_msg
            payment_obj.status = "failed"
            payment_obj.save()

            self._log_payment_action(
                payment_obj,
                "error_occurred",
                {"error": error_msg},
                request,
            )

            return {
                "success": False,
                "error": "Unable to connect to payment gateway. Please try again.",
            }

        except Exception as e:
            error_msg = f"Error initiating payment: {str(e)}"
            logger.error(error_msg)
            payment_obj.error_message = error_msg
            payment_obj.status = "failed"
            payment_obj.save()

            return {
                "success": False,
                "error": "An unexpected error occurred. Please try again.",
            }

    def validate_payment(self, transaction_id, val_id):
        """
        Validate payment with SSLCOMMERZ validation API

        Args:
            transaction_id: Our transaction ID
            val_id: SSLCOMMERZ validation ID from callback

        Returns:
            dict: Contains 'success' status and validation response
        """
        try:
            payload = {
                "val_id": val_id,
                "store_id": self.store_id,
                "store_passwd": self.store_password,
                "format": "json",
            }

            logger.info(f"Validating payment: {transaction_id}")
            response = requests.get(
                self.validation_url,
                params=payload,
                timeout=10,
                verify=True,
            )
            response.raise_for_status()

            validation_response = response.json()
            logger.info(f"Validation response: {validation_response}")

            # Check validation status
            if validation_response.get("status") == "VALID":
                return {
                    "success": True,
                    "validation_response": validation_response,
                }
            else:
                return {
                    "success": False,
                    "error": f"Payment validation failed: {validation_response.get('status')}",
                    "validation_response": validation_response,
                }

        except requests.exceptions.RequestException as e:
            error_msg = f"Network error during validation: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
            }

        except Exception as e:
            error_msg = f"Error validating payment: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
            }

    def process_callback(self, callback_data, payment_obj, request=None):
        """
        Process IPN/callback from SSLCOMMERZ

        Args:
            callback_data: Data received from SSLCOMMERZ callback
            payment_obj: Payment model instance
            request: HTTP request object

        Returns:
            dict: Processing result
        """
        try:
            logger.info(f"Processing callback for: {payment_obj.transaction_id}")

            # Log callback reception
            self._log_payment_action(
                payment_obj,
                "callback_received",
                callback_data,
                request,
            )

            # Check if payment status from callback indicates success
            ssl_status = callback_data.get("status")

            if ssl_status == "VALID" or ssl_status == "VALIDATED":
                # Validate with SSLCOMMERZ API
                val_id = callback_data.get("val_id")
                validation_result = self.validate_payment(
                    payment_obj.transaction_id,
                    val_id,
                )

                if validation_result["success"]:
                    # Mark payment as completed and promote job
                    with db_transaction.atomic():
                        payment_obj.mark_as_completed(
                            validation_result.get("validation_response")
                        )

                        self._log_payment_action(
                            payment_obj,
                            "validation_success",
                            validation_result.get("validation_response"),
                            request,
                        )

                        self._log_payment_action(
                            payment_obj,
                            "job_promoted",
                            {
                                "job_id": payment_obj.job.id,
                                "promoted_until": payment_obj.promoted_until.isoformat(),
                            },
                            request,
                        )

                    logger.info(
                        f"Payment completed and job promoted: {payment_obj.transaction_id}"
                    )

                    return {
                        "success": True,
                        "message": "Payment validated successfully. Job promoted!",
                    }
                else:
                    # Validation failed
                    payment_obj.mark_as_failed(validation_result.get("error"))

                    self._log_payment_action(
                        payment_obj,
                        "validation_failed",
                        validation_result,
                        request,
                    )

                    logger.warning(
                        f"Payment validation failed: {payment_obj.transaction_id}"
                    )

                    return {
                        "success": False,
                        "message": validation_result.get("error"),
                    }
            else:
                # Payment failed at SSLCOMMERZ
                error_msg = callback_data.get("error_description", "Unknown error")
                payment_obj.mark_as_failed(error_msg)

                self._log_payment_action(
                    payment_obj,
                    "error_occurred",
                    {"ssl_status": ssl_status, "error": error_msg},
                    request,
                )

                logger.warning(
                    f"Payment failed at gateway: {payment_obj.transaction_id} - {error_msg}"
                )

                return {
                    "success": False,
                    "message": error_msg,
                }

        except Exception as e:
            error_msg = f"Error processing callback: {str(e)}"
            logger.error(error_msg)
            payment_obj.mark_as_failed(error_msg)

            return {
                "success": False,
                "message": "An error occurred processing the payment.",
            }

    # ==================== PRIVATE HELPER METHODS ====================

    def _prepare_payload(self, payment_obj, request):
        """
        Prepare payload for SSLCOMMERZ API

        Required fields according to SSLCOMMERZ documentation
        """
        # Get user's IP address (from request or use localhost for testing)
        if hasattr(request, "META"):
            client_ip = request.META.get("HTTP_X_FORWARDED_FOR", "")
            if client_ip:
                client_ip = client_ip.split(",")[0].strip()
            else:
                client_ip = request.META.get("REMOTE_ADDR", "127.0.0.1")
        else:
            client_ip = "127.0.0.1"

        recruiter = payment_obj.recruiter
        job = payment_obj.job

        payload = {
            # Credentials
            "store_id": self.store_id,
            "store_passwd": self.store_password,
            # Transaction Information
            "total_amount": str(payment_obj.amount),
            "currency": payment_obj.currency,
            "tran_id": payment_obj.transaction_id,  # Our transaction ID
            # Product Information
            "product_category": "Job Promotion",
            "product_name": f"Job Promotion - {job.title}",
            "product_profile": "physical-goods",  # Required for general products
            # Customer Information
            "cus_name": recruiter.full_name,
            "cus_email": recruiter.email,
            "cus_add1": recruiter.profile.bio or "N/A",
            "cus_city": "Dhaka",
            "cus_postcode": "1000",
            "cus_country": "Bangladesh",
            "cus_phone": recruiter.profile.phone_number or "01000000000",
            # Shipping Information (can be same as customer)
            "ship_name": recruiter.full_name,
            "ship_add1": recruiter.profile.bio or "N/A",
            "ship_city": "Dhaka",
            "ship_postcode": "1000",
            "ship_country": "Bangladesh",
            # Callback URLs
            "success_url": f"{settings.FRONTEND_URL}/payment-success",
            "fail_url": f"{settings.FRONTEND_URL}/payment-failed",
            "cancel_url": f"{settings.FRONTEND_URL}/payment-cancel",
            "ipn_url": f"{settings.BACKEND_URL}/api/payments/ipn-callback/",
            # Additional Information
            "emi_option": "0",
            "no_shipping": "1",
            "client_ip": client_ip,
        }

        return payload

    @staticmethod
    def _log_payment_action(payment_obj, action, details, request=None):
        """Log payment action for audit trail"""

        try:
            ip_address = None
            if request and hasattr(request, "META"):
                ip_address = request.META.get("HTTP_X_FORWARDED_FOR", "")
                if ip_address:
                    ip_address = ip_address.split(",")[0].strip()
                else:
                    ip_address = request.META.get("REMOTE_ADDR", None)

            PaymentLog.objects.create(
                payment=payment_obj,
                action=action,
                details=details,
                ip_address=ip_address,
            )
        except Exception as e:
            logger.error(f"Error logging payment action: {str(e)}")

    @staticmethod
    def generate_transaction_id():
        """Generate unique transaction ID"""
        return f"JOB-{uuid.uuid4().hex[:12].upper()}-{int(timezone.now().timestamp())}"
