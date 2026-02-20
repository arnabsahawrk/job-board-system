import uuid
from django.core.mail import send_mail
from django.template.loader import render_to_string
from apps.authentication.models import EmailVerification
from django.conf import settings


class Services:
    """Application services for common operations"""

    @staticmethod
    def user_role(user):
        """Safely return user role for typed request.user access."""
        return getattr(user, "role", None)

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
