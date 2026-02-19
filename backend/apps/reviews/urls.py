from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.reviews.views import ReviewViewSet

# Create router and register viewset
router = DefaultRouter()
router.register(r"reviews", ReviewViewSet, basename="review")

# URL patterns
urlpatterns = [
    path("", include(router.urls)),
]

# This will generate the following URLs:

# LIST & CREATE
# GET    /api/reviews/                              - List all reviews (anyone)
# POST   /api/reviews/                              - Create review (job seeker)

# DETAIL
# GET    /api/reviews/{id}/                         - Review details
# PATCH  /api/reviews/{id}/                         - Update review (reviewer only)
# DELETE /api/reviews/{id}/                         - Delete review (reviewer only)

# CUSTOM ACTIONS
# GET    /api/reviews/recruiter_reviews/            - Get reviews for recruiter
# GET    /api/reviews/my_reviews/                   - My reviews (job seeker)
# GET    /api/reviews/my_received_reviews/          - My received reviews (recruiter)
# GET    /api/reviews/recruiter_statistics/         - Recruiter review statistics
# GET    /api/reviews/job_reviews/                  - Reviews for specific job
# GET    /api/reviews/top_recruiters/               - Top rated recruiters
# POST   /api/reviews/{id}/helpful/                 - Toggle mark review as helpful
# GET    /api/reviews/{id}/helpful_votes/           - Get helpful votes info

# Query Parameters Examples:
# /api/reviews/recruiter_reviews/?recruiter_id=1
# /api/reviews/recruiter_reviews/?recruiter_id=1&job_id=5
# /api/reviews/recruiter_statistics/?recruiter_id=1
# /api/reviews/job_reviews/?job_id=5
# /api/reviews/top_recruiters/?limit=20
# /api/reviews/?recruiter_id=1&rating=5
# /api/reviews/?search=django&ordering=-created_at

# ============ CORE CRUD ============
# GET /api/reviews/
#   - List all reviews (public)
#   - Anyone can access
#   - Filters: recruiter, job, rating
#   - Search: recruiter name, reviewer name, job title, comment
#   - Ordering: created_at, rating
#   - Default ordering: -created_at (newest first)
#   - Example: GET /api/reviews/?rating=5&ordering=-created_at

# POST /api/reviews/
#   - Create new review
#   - Job seeker only
#   - Required: job_id, rating (1-5)
#   - Optional: comment (max 1000 chars)
#   - Must have applied to job before reviewing
#   - One review per job per reviewer
#   - Example:
#     POST /api/reviews/
#     Body: {
#       "job_id": 5,
#       "rating": 5,
#       "comment": "Great company and interviewing process!"
#     }

# GET /api/reviews/{id}/
#   - View review details
#   - Anyone can access
#   - Returns: ReviewDetailSerializer with full info
#   - Example: GET /api/reviews/1/

# PATCH /api/reviews/{id}/
#   - Update review
#   - Reviewer only
#   - Can update: rating, comment
#   - Example:
#     PATCH /api/reviews/1/
#     Body: {
#       "rating": 4,
#       "comment": "Updated comment"
#     }

# DELETE /api/reviews/{id}/
#   - Delete review
#   - Reviewer only
#   - Example: DELETE /api/reviews/1/

# ============ CUSTOM ACTIONS ============
# GET /api/reviews/recruiter_reviews/
#   - Get all reviews for a specific recruiter
#   - Anyone can access
#   - Required param: recruiter_id
#   - Optional param: job_id (filter by specific job)
#   - Returns: List of ReviewListSerializer
#   - Example:
#     GET /api/reviews/recruiter_reviews/?recruiter_id=3
#     GET /api/reviews/recruiter_reviews/?recruiter_id=3&job_id=5

# GET /api/reviews/my_reviews/
#   - Get all reviews written by current job seeker
#   - Job seeker only
#   - No parameters needed
#   - Returns: List of ReviewListSerializer
#   - Example: GET /api/reviews/my_reviews/

# GET /api/reviews/my_received_reviews/
#   - Get all reviews received by current recruiter
#   - Recruiter only
#   - No parameters needed
#   - Returns: List of ReviewListSerializer
#   - Example: GET /api/reviews/my_received_reviews/

# GET /api/reviews/recruiter_statistics/
#   - Get review statistics for a recruiter
#   - Anyone can access
#   - Required param: recruiter_id
#   - Returns: {
#       "total_reviews": 10,
#       "average_rating": 4.5,
#       "five_star": 6,
#       "four_star": 3,
#       "three_star": 1,
#       "two_star": 0,
#       "one_star": 0
#     }
#   - Example: GET /api/reviews/recruiter_statistics/?recruiter_id=3

# GET /api/reviews/job_reviews/
#   - Get all reviews for a specific job
#   - Anyone can access
#   - Required param: job_id
#   - Returns: List of ReviewListSerializer
#   - Example: GET /api/reviews/job_reviews/?job_id=5

# GET /api/reviews/top_recruiters/
#   - Get top rated recruiters by average rating
#   - Anyone can access
#   - Optional param: limit (default 10, max 100)
#   - Returns: List of recruiters with avg_rating, review_count
#   - Returns: [
#       {
#         "recruiter": 3,
#         "recruiter__full_name": "Jane Recruiter",
#         "avg_rating": 4.8,
#         "review_count": 15
#       },
#       ...
#     ]
#   - Example:
#     GET /api/reviews/top_recruiters/
#     GET /api/reviews/top_recruiters/?limit=20

# POST /api/reviews/{id}/helpful/
#   - Toggle mark review as helpful
#   - Authenticated users only
#   - Adds helpful vote if not exists (toggles on/off)
#   - Returns helpful count
#   - Returns: {
#       "message": "Review marked as helpful",
#       "helpful_count": 5
#     }
#   - OR:
#     {
#       "message": "Review marked as not helpful",
#       "helpful_count": 4
#     }
#   - Example: POST /api/reviews/1/helpful/

# GET /api/reviews/{id}/helpful_votes/
#   - Get helpful votes information for a review
#   - Anyone can access
#   - Returns: {
#       "review_id": 1,
#       "helpful_count": 5,
#       "is_helpful_by_current_user": true
#     }
#   - Example: GET /api/reviews/1/helpful_votes/

# ============ USEFUL QUERY COMBINATIONS ============
# Get all 5-star reviews for a recruiter
# GET /api/reviews/recruiter_reviews/?recruiter_id=3&rating=5

# Get reviews for a specific job sorted by newest
# GET /api/reviews/job_reviews/?job_id=5

# Search reviews mentioning "python"
# GET /api/reviews/?search=python

# Get top 5 recruiters
# GET /api/reviews/top_recruiters/?limit=5

# Get reviews by recruiter and job
# GET /api/reviews/?recruiter_id=3&job_id=5

# Filter by recruiter and sort by rating (highest first)
# GET /api/reviews/?recruiter_id=3&ordering=-rating
