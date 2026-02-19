from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.applications.models import Application
from apps.applications.serializers import (
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ApplicationCreateSerializer,
    ApplicationStatusUpdateSerializer,
)
from apps.authentication.serializers import UserSerializer


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Application management.
    - Job seekers can create applications
    - Job seekers can view their own applications
    - Recruiters can view applications for their jobs
    - Recruiters can update application status
    """

    queryset = Application.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Filtering options
    filterset_fields = ["job", "status"]
    search_fields = ["applicant__full_name", "applicant__email", "job__title"]
    ordering_fields = ["applied_at", "status"]
    ordering = ["-applied_at"]

    @staticmethod
    def _user_role(user):
        """Safely return user role for typed request.user access."""
        return getattr(user, "role", None)

    def get_serializer_class(self):
        """Return different serializer based on action"""
        if self.action == "retrieve":
            return ApplicationDetailSerializer
        elif self.action == "create":
            return ApplicationCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return ApplicationStatusUpdateSerializer
        else:
            return ApplicationListSerializer

    def get_queryset(self):
        """
        Filter applications based on user role:
        - Job seekers see only their applications
        - Recruiters see applications for their jobs
        """
        user = self.request.user
        user_role = self._user_role(user)

        if user_role == "seeker":
            # Job seekers see their own applications
            return Application.objects.filter(applicant=user)
        elif user_role == "recruiter":
            # Recruiters see applications for their jobs
            return Application.objects.filter(job__recruiter=user)

        return Application.objects.none()

    def create(self, request, *args, **kwargs):
        """Create application (job seeker only)"""
        # Check if user is a job seeker
        if self._user_role(request.user) != "seeker":
            return Response(
                {"error": "Only job seekers can apply for jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        application = serializer.save()

        # Return detail serializer
        return Response(
            ApplicationDetailSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """Update application (recruiter only)"""
        application = self.get_object()

        # Check if user is the recruiter who posted the job
        if application.job.recruiter != request.user:
            return Response(
                {"error": "You can only update applications for your jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Only allow status updates
        serializer = self.get_serializer(application, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            ApplicationDetailSerializer(application).data, status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        """Delete application (applicant only)"""
        application = self.get_object()

        # Check if user is the applicant
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
        if self._user_role(request.user) != "seeker":
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
        if self._user_role(request.user) != "recruiter":
            return Response(
                {"error": "Only recruiters can view job applications"},
                status=status.HTTP_403_FORBIDDEN,
            )

        applications = Application.objects.filter(job__recruiter=request.user)

        # Optional: filter by job if job_id provided in query params
        job_id = request.query_params.get("job_id")
        if job_id:
            applications = applications.filter(job_id=job_id)

        serializer = ApplicationListSerializer(applications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """Update application status (recruiter only)"""
        application = self.get_object()

        # Check if user is the recruiter
        if application.job.recruiter != request.user:
            return Response(
                {"error": "You can only update applications for your jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ApplicationStatusUpdateSerializer(
            application, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            ApplicationDetailSerializer(application).data, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def applicant_profile(self, request, pk=None):
        """Get applicant's full profile"""
        application = self.get_object()

        # Check if user is recruiter of this job or the applicant
        if (
            application.job.recruiter != request.user
            and application.applicant != request.user
        ):
            return Response(
                {"error": "You do not have permission to view this profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UserSerializer(application.applicant, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def status_summary(self, request):
        """Get summary of application statuses"""
        user_role = self._user_role(request.user)

        if user_role == "seeker":
            applications = Application.objects.filter(applicant=request.user)
        elif user_role == "recruiter":
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
