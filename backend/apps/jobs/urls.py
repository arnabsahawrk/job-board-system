from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.jobs.views import JobViewSet

# Create router and register viewset
router = DefaultRouter()
router.register(r"jobs", JobViewSet, basename="job")

# URL patterns
urlpatterns = [
    path("", include(router.urls)),
]

# This will generate the following URLs:
# GET    /api/jobs/                    - List all jobs (anyone)
# POST   /api/jobs/                    - Create job (recruiter only)
# GET    /api/jobs/{id}/               - Job details (anyone)
# PATCH  /api/jobs/{id}/               - Update job (recruiter only)
# DELETE /api/jobs/{id}/               - Delete job (recruiter only)
# GET    /api/jobs/my_jobs/            - My jobs (recruiter only)
# GET    /api/jobs/{id}/similar_jobs/  - Similar jobs (anyone)
