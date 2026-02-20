from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.applications.models import Application, ApplicationFeedback
from apps.applications.serializers import (
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ApplicationCreateSerializer,
    ApplicationStatusUpdateSerializer,
)
from apps.authentication.serializers import UserDetailSerializer
from apps.applications.serializers import ApplicationFeedbackSerializer
from apps.core.services import Services


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Application management.
    - Job seekers can create applications
    - Job seekers can view their own applications
    - Recruiters can view applications for their jobs
    - Recruiters can update application status with feedback
    - Email notifications sent on application and status updates
    """

    queryset = Application.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ["job", "status"]
    search_fields = ["applicant__full_name", "applicant__email", "job__title"]
    ordering_fields = ["applied_at", "status"]
    ordering = ["-applied_at"]

    def get_serializer_class(self):
        """Return different serializer based on action"""
        if self.action == "retrieve":
            return ApplicationDetailSerializer
        elif self.action == "create":
            return ApplicationCreateSerializer
        elif self.action in ["update", "partial_update", "update_status"]:
            return ApplicationStatusUpdateSerializer
        else:
            return ApplicationListSerializer

    def get_queryset(self):
        """Filter applications based on user role"""
        user = self.request.user

        if Services.user_role(user) == "seeker":
            return Application.objects.filter(applicant=user)
        elif Services.user_role(user) == "recruiter":
            return Application.objects.filter(job__recruiter=user)

        return Application.objects.none()

    def create(self, request, *args, **kwargs):
        """Create application (job seeker only) and send notifications"""
        if Services.user_role(request.user) != "seeker":
            return Response(
                {"error": "Only job seekers can apply for jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        application = serializer.save()

        # Send email notifications
        # 1. Email to job seeker confirming application
        Services.send_application_received_email(application)

        # 2. Email to recruiter notifying of new application
        Services.send_new_application_notification_email(application)

        return Response(
            ApplicationDetailSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """Update application (recruiter only)"""
        application = self.get_object()

        if application.job.recruiter != request.user:
            return Response(
                {"error": "You can only update applications for your jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(application, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            ApplicationDetailSerializer(application).data, status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        """Delete application (applicant only)"""
        application = self.get_object()

        if application.applicant != request.user:
            return Response(
                {"error": "You can only delete your own applications"},
                status=status.HTTP_403_FORBIDDEN,
            )

        application.delete()
        return Response(
            {"message": "Application deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_applications(self, request):
        """Get all applications by current job seeker"""
        if Services.user_role(request.user) != "seeker":
            return Response(
                {"error": "Only job seekers can view their applications"},
                status=status.HTTP_403_FORBIDDEN,
            )

        applications = Application.objects.filter(applicant=request.user)
        serializer = ApplicationListSerializer(applications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def job_applications(self, request):
        """Get all applications for recruiter's jobs"""
        if Services.user_role(request.user) != "recruiter":
            return Response(
                {"error": "Only recruiters can view job applications"},
                status=status.HTTP_403_FORBIDDEN,
            )

        applications = Application.objects.filter(job__recruiter=request.user)

        job_id = request.query_params.get("job_id")
        if job_id:
            applications = applications.filter(job_id=job_id)

        serializer = ApplicationListSerializer(applications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """
        Update application status with feedback and send email notification.
        Requires 'status' and 'feedback_text' in request body.
        """
        application = self.get_object()

        if application.job.recruiter != request.user:
            return Response(
                {"error": "You can only update applications for your jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        status_value = request.data.get("status")
        feedback_text = request.data.get("feedback_text")

        valid_statuses = [choice[0] for choice in Application.STATUS_CHOICES]
        if status_value not in valid_statuses:
            return Response(
                {
                    "error": f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not feedback_text or len(feedback_text.strip()) == 0:
            return Response(
                {"error": "Feedback is required when updating application status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(feedback_text) > 1000:
            return Response(
                {"error": "Feedback must be less than 1000 characters"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update application status
        application.status = status_value
        application.save()

        # Create or update feedback
        feedback, created = ApplicationFeedback.objects.update_or_create(
            application=application,
            defaults={
                "recruiter": request.user,
                "feedback_text": feedback_text,
                "status_given": status_value,
            },
        )

        # Send appropriate email notification based on status
        if status_value == "accepted":
            Services.send_application_accepted_email(application)
        elif status_value == "rejected":
            Services.send_application_rejected_email(application, feedback_text)
        else:
            # For pending and reviewed statuses
            Services.send_application_status_update_email(application, feedback_text)

        return Response(
            {
                "message": "Application status updated with feedback",
                "application": ApplicationDetailSerializer(application).data,
                "feedback": {
                    "id": feedback.id,
                    "feedback_text": feedback.feedback_text,
                    "status_given": feedback.status_given,
                    "created_at": feedback.created_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def applicant_profile(self, request, pk=None):
        """Get applicant's full profile"""
        application = self.get_object()

        if (
            application.job.recruiter != request.user
            and application.applicant != request.user
        ):
            return Response(
                {"error": "You do not have permission to view this profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UserDetailSerializer(
            application.applicant, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def status_summary(self, request):
        """Get summary of application statuses"""
        if Services.user_role(request.user) == "seeker":
            applications = Application.objects.filter(applicant=request.user)
        elif Services.user_role(request.user) == "recruiter":
            applications = Application.objects.filter(job__recruiter=request.user)
        else:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        summary = {
            "total": applications.count(),
            "pending": applications.filter(status="pending").count(),
            "reviewed": applications.filter(status="reviewed").count(),
            "accepted": applications.filter(status="accepted").count(),
            "rejected": applications.filter(status="rejected").count(),
        }

        return Response(summary)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def feedback(self, request, pk=None):
        """Get feedback for an application"""
        application = self.get_object()

        if (
            application.applicant != request.user
            and application.job.recruiter != request.user
        ):
            return Response(
                {"error": "You do not have permission to view this feedback"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not hasattr(application, "feedback"):
            return Response(
                {"error": "No feedback available for this application"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ApplicationFeedbackSerializer(application.feedback)
        return Response(serializer.data)
