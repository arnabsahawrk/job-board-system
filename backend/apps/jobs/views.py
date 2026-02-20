from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_yasg import openapi

from apps.jobs.models import Job
from apps.jobs.serializers import (
    JobListSerializer,
    JobDetailSerializer,
    JobCreateUpdateSerializer,
)
from apps.core.permissions import IsRecruiterOrReadOnly
from apps.core.swagger_docs import SwaggerDocumentation


class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Job listing, creation, and management.
    - Anyone can view jobs
    - Only recruiters can create, update, delete
    """

    queryset = Job.objects.all()
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Filtering options
    filterset_fields = ["category", "job_type", "location"]
    search_fields = ["title", "company_name", "description"]
    ordering_fields = ["created_at", "salary"]
    ordering = ["-created_at"]  # Default ordering

    def get_serializer_class(self):
        """Return different serializer based on action"""
        if self.action == "retrieve":
            return JobDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return JobCreateUpdateSerializer
        else:
            return JobListSerializer

    def get_permissions(self):
        """
        Override permissions:
        - List and retrieve: AllowAny
        - Create, update, delete: IsAuthenticated + IsRecruiter
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        elif self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [IsAuthenticated, IsRecruiterOrReadOnly]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create a new job (recruiter only)"""
        # Check if user is recruiter
        if request.user.role != "recruiter":
            return Response(
                {"error": "Only recruiters can post jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save with recruiter as the poster
        self.perform_create(serializer, request.user)

        return Response(
            JobDetailSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer, user):
        """Save job with recruiter"""
        serializer.save(recruiter=user)

    def update(self, request, *args, **kwargs):
        """Update a job (recruiter who posted it only)"""
        job = self.get_object()

        # Check if user is the recruiter who posted this job
        if job.recruiter != request.user:
            return Response(
                {"error": "You can only update your own jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(job, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            JobDetailSerializer(serializer.instance).data, status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a job (recruiter who posted it only)"""
        job = self.get_object()

        # Check if user is the recruiter who posted this job
        if job.recruiter != request.user:
            return Response(
                {"error": "You can only delete your own jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        job.delete()
        return Response(
            {"message": "Job deleted successfully"}, status=status.HTTP_204_NO_CONTENT
        )

    @SwaggerDocumentation.custom_action(
        method="get",
        response_schema=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT),
        ),
        description="Get current recruiter's jobs",
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_jobs(self, request):
        """Get all jobs posted by current recruiter"""
        if request.user.role != "recruiter":
            return Response(
                {"error": "Only recruiters can view their jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        jobs = Job.objects.filter(recruiter=request.user)
        serializer = JobListSerializer(jobs, many=True)
        return Response(serializer.data)

    @SwaggerDocumentation.custom_action(
        method="get",
        response_schema=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT),
        ),
        description="Get similar jobs",
    )
    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def similar_jobs(self, request, pk=None):
        """Get similar jobs based on category and location"""
        job = self.get_object()

        similar = Job.objects.filter(
            category=job.category,
            location=job.location,
        ).exclude(id=job.id)[:5]

        serializer = JobListSerializer(similar, many=True)
        return Response(serializer.data)
