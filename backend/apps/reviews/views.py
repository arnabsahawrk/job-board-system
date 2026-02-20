from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Avg, Count
from drf_yasg import openapi

from apps.reviews.models import Review, ReviewHelpful
from apps.reviews.serializers import (
    ReviewListSerializer,
    ReviewDetailSerializer,
    ReviewCreateUpdateSerializer,
    ReviewStatisticsSerializer,
)
from apps.core.permissions import IsReviewerOrReadOnly, IsJobSeeker
from apps.core.swagger_docs import SwaggerDocumentation


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Review management.
    - Anyone can view reviews
    - Only job seekers who applied can create reviews
    - Only reviewers can update/delete their reviews
    """

    queryset = Review.objects.all()
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Filtering options
    filterset_fields = ["recruiter", "job", "rating"]
    search_fields = [
        "recruiter__full_name",
        "reviewer__full_name",
        "job__title",
        "comment",
    ]
    ordering_fields = ["created_at", "rating"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return different serializer based on action"""
        if self.action == "retrieve":
            return ReviewDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return ReviewCreateUpdateSerializer
        else:
            return ReviewListSerializer

    def get_permissions(self):
        """
        Override permissions:
        - List and retrieve: AllowAny
        - Create: IsAuthenticated + IsJobSeeker
        - Update, delete: IsAuthenticated + IsReviewer
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        elif self.action == "create":
            permission_classes = [IsAuthenticated, IsJobSeeker]
        elif self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [IsAuthenticated, IsReviewerOrReadOnly]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create a review (job seeker only)"""
        # Check if user is a job seeker
        if request.user.role != "seeker":
            return Response(
                {"error": "Only job seekers can leave reviews"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = serializer.save()

        return Response(
            ReviewDetailSerializer(review).data, status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Update a review (reviewer only)"""
        review = self.get_object()

        # Check if user is the reviewer
        if review.reviewer != request.user:
            return Response(
                {"error": "You can only update your own reviews"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            ReviewDetailSerializer(serializer.instance).data, status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a review (reviewer only)"""
        review = self.get_object()

        # Check if user is the reviewer
        if review.reviewer != request.user:
            return Response(
                {"error": "You can only delete your own reviews"},
                status=status.HTTP_403_FORBIDDEN,
            )

        review.delete()
        return Response(
            {"message": "Review deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )

    @SwaggerDocumentation.custom_action(
        method="get",
        response_schema=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT),
        ),
        manual_parameters=[
            openapi.Parameter(
                "recruiter_id",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                required=True,
                description="Recruiter ID",
            ),
            openapi.Parameter(
                "job_id",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                required=False,
                description="Optional job ID filter",
            ),
        ],
        description="Get recruiter reviews",
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def recruiter_reviews(self, request):
        """Get all reviews for a specific recruiter"""
        recruiter_id = request.query_params.get("recruiter_id")

        if not recruiter_id:
            return Response(
                {"error": "recruiter_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reviews = Review.objects.filter(recruiter_id=recruiter_id)

        # Optional: filter by job if job_id provided
        job_id = request.query_params.get("job_id")
        if job_id:
            reviews = reviews.filter(job_id=job_id)

        serializer = ReviewListSerializer(reviews, many=True)
        return Response(serializer.data)

    @SwaggerDocumentation.custom_action(
        method="get",
        response_schema=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT),
        ),
        description="Get my reviews",
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_reviews(self, request):
        """Get all reviews written by current user"""
        if request.user.role != "seeker":
            return Response(
                {"error": "Only job seekers can view their reviews"},
                status=status.HTTP_403_FORBIDDEN,
            )

        reviews = Review.objects.filter(reviewer=request.user)
        serializer = ReviewListSerializer(reviews, many=True)
        return Response(serializer.data)

    @SwaggerDocumentation.custom_action(
        method="get",
        response_schema=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT),
        ),
        description="Get my received reviews",
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_received_reviews(self, request):
        """Get all reviews received by current recruiter"""
        if request.user.role != "recruiter":
            return Response(
                {"error": "Only recruiters can view their received reviews"},
                status=status.HTTP_403_FORBIDDEN,
            )

        reviews = Review.objects.filter(recruiter=request.user)
        serializer = ReviewListSerializer(reviews, many=True)
        return Response(serializer.data)

    @SwaggerDocumentation.custom_action(
        method="get",
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "total_reviews": openapi.Schema(type=openapi.TYPE_INTEGER),
                "average_rating": openapi.Schema(type=openapi.TYPE_NUMBER),
                "five_star": openapi.Schema(type=openapi.TYPE_INTEGER),
                "four_star": openapi.Schema(type=openapi.TYPE_INTEGER),
                "three_star": openapi.Schema(type=openapi.TYPE_INTEGER),
                "two_star": openapi.Schema(type=openapi.TYPE_INTEGER),
                "one_star": openapi.Schema(type=openapi.TYPE_INTEGER),
            },
        ),
        manual_parameters=[
            openapi.Parameter(
                "recruiter_id",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                required=True,
                description="Recruiter ID",
            )
        ],
        description="Get recruiter statistics",
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def recruiter_statistics(self, request):
        """Get review statistics for a recruiter"""
        recruiter_id = request.query_params.get("recruiter_id")

        if not recruiter_id:
            return Response(
                {"error": "recruiter_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reviews = Review.objects.filter(recruiter_id=recruiter_id)

        # Calculate statistics
        total = reviews.count()

        if total == 0:
            statistics = {
                "total_reviews": 0,
                "average_rating": 0,
                "five_star": 0,
                "four_star": 0,
                "three_star": 0,
                "two_star": 0,
                "one_star": 0,
            }
        else:
            average = reviews.aggregate(avg_rating=Avg("rating"))["avg_rating"]

            statistics = {
                "total_reviews": total,
                "average_rating": round(average, 2),
                "five_star": reviews.filter(rating=5).count(),
                "four_star": reviews.filter(rating=4).count(),
                "three_star": reviews.filter(rating=3).count(),
                "two_star": reviews.filter(rating=2).count(),
                "one_star": reviews.filter(rating=1).count(),
            }

        serializer = ReviewStatisticsSerializer(statistics)
        return Response(serializer.data)

    @SwaggerDocumentation.custom_action(
        method="get",
        response_schema=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT),
        ),
        manual_parameters=[
            openapi.Parameter(
                "job_id",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                required=True,
                description="Job ID",
            )
        ],
        description="Get job reviews",
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def job_reviews(self, request):
        """Get all reviews for a specific job"""
        job_id = request.query_params.get("job_id")

        if not job_id:
            return Response(
                {"error": "job_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reviews = Review.objects.filter(job_id=job_id)
        serializer = ReviewListSerializer(reviews, many=True)
        return Response(serializer.data)

    @SwaggerDocumentation.custom_action(
        method="get",
        response_schema=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT),
        ),
        manual_parameters=[
            openapi.Parameter(
                "limit",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                required=False,
                description="Number of recruiters to return",
            )
        ],
        description="Get top recruiters by average rating",
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def top_recruiters(self, request):
        """Get top recruiters by average rating"""
        limit = int(request.query_params.get("limit", 10))

        recruiters = (
            Review.objects.values("recruiter", "recruiter__full_name")
            .annotate(avg_rating=Avg("rating"), review_count=Count("id"))
            .filter(review_count__gte=1)  # Only recruiters with at least 1 review
            .order_by("-avg_rating")[:limit]
        )

        return Response(recruiters)

    @SwaggerDocumentation.custom_action(
        method="post",
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "message": openapi.Schema(type=openapi.TYPE_STRING),
                "helpful_count": openapi.Schema(type=openapi.TYPE_INTEGER),
            },
        ),
        description="Toggle helpful vote",
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def helpful(self, request, pk=None):
        """
        Mark review as helpful.
        Allows any authenticated user to mark a review as helpful.
        Toggles helpful vote (add if not exists, remove if exists).
        """
        review = self.get_object()
        user = request.user

        # Check if user has already marked this review as helpful
        helpful_vote = ReviewHelpful.objects.filter(review=review, user=user).first()

        if helpful_vote:
            # User already marked as helpful, so remove the vote (toggle)
            helpful_vote.delete()
            return Response(
                {
                    "message": "Review marked as not helpful",
                    "helpful_count": review.helpful_votes.count(),
                },
                status=status.HTTP_200_OK,
            )
        else:
            # Mark as helpful (create vote)
            ReviewHelpful.objects.create(review=review, user=user)
            return Response(
                {
                    "message": "Review marked as helpful",
                    "helpful_count": review.helpful_votes.count(),
                },
                status=status.HTTP_200_OK,
            )

    @SwaggerDocumentation.custom_action(
        method="get",
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "review_id": openapi.Schema(type=openapi.TYPE_INTEGER),
                "helpful_count": openapi.Schema(type=openapi.TYPE_INTEGER),
                "is_helpful_by_current_user": openapi.Schema(type=openapi.TYPE_BOOLEAN),
            },
        ),
        description="Get helpful vote details",
    )
    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def helpful_votes(self, request, pk=None):
        """Get helpful votes count and votes details for a review"""
        review = self.get_object()

        helpful_count = review.helpful_votes.count()
        is_helpful_by_user = False

        if request.user.is_authenticated:
            is_helpful_by_user = review.helpful_votes.filter(user=request.user).exists()

        return Response(
            {
                "review_id": review.id,
                "helpful_count": helpful_count,
                "is_helpful_by_current_user": is_helpful_by_user,
            },
            status=status.HTTP_200_OK,
        )
