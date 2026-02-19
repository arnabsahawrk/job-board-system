from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.applications.views import ApplicationViewSet

# Create router and register viewset
router = DefaultRouter()
router.register(r"applications", ApplicationViewSet, basename="application")

# URL patterns
urlpatterns = [
    path("", include(router.urls)),
]

# This will generate the following URLs:

# LIST & CREATE
# GET    /api/applications/                          - List applications (filtered by role)
# POST   /api/applications/                          - Apply for job (job seeker only)

# DETAIL
# GET    /api/applications/{id}/                     - Application details
# PATCH  /api/applications/{id}/                     - Update status (recruiter only)
# DELETE /api/applications/{id}/                     - Delete application (applicant only)

# CUSTOM ACTIONS
# GET    /api/applications/my_applications/         - My applications (job seeker)
# GET    /api/applications/job_applications/        - Applications for my jobs (recruiter)
# POST   /api/applications/{id}/update_status/      - Update status with feedback (recruiter)
# GET    /api/applications/{id}/applicant_profile/  - Get applicant's full profile
# GET    /api/applications/{id}/feedback/           - Get feedback for application
# GET    /api/applications/status_summary/          - Summary of application counts

# Query Parameters Examples:
# /api/applications/my_applications/
# /api/applications/job_applications/?job_id=5
# /api/applications/status_summary/
