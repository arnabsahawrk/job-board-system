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

# FEEDBACK USAGE:
# POST /api/applications/1/update_status/
# Body: {
#   "status": "reviewed",
#   "feedback_text": "Thank you for applying! We reviewed your application and would like to schedule an interview."
# }

# GET /api/applications/1/feedback/
# Response: {
#   "id": 1,
#   "applicant_name": "John Seeker",
#   "applicant_email": "john@example.com",
#   "job_title": "Senior Django Developer",
#   "feedback_text": "Thank you for applying!...",
#   "status_given": "reviewed",
#   "created_at": "2026-02-17T10:00:00Z"
# }

# DETAILED ENDPOINT DESCRIPTIONS:

# ============ CORE CRUD ============
# GET /api/applications/
#   - List all applications
#   - Job seekers see their own applications
#   - Recruiters see applications for their jobs
#   - Filters: job, status
#   - Search: applicant name/email, job title
#   - Ordering: applied_at, status

# POST /api/applications/
#   - Create new job application
#   - Job seeker only
#   - Required: job_id, resume
#   - Optional: cover_letter
#   - Prevents duplicate applications

# GET /api/applications/{id}/
#   - View application details
#   - Access: applicant or recruiter of job

# PATCH /api/applications/{id}/
#   - Update application (old method)
#   - Use /update_status/ instead for new implementations

# DELETE /api/applications/{id}/
#   - Delete application
#   - Applicant only

# ============ CUSTOM ACTIONS ============
# GET /api/applications/my_applications/
#   - List all applications by current job seeker
#   - Job seeker only
#   - Returns: ApplicationListSerializer
#   - Example: GET /api/applications/my_applications/

# GET /api/applications/job_applications/
#   - List all applications for recruiter's jobs
#   - Recruiter only
#   - Optional filter: ?job_id=5
#   - Returns: ApplicationListSerializer
#   - Example: GET /api/applications/job_applications/?job_id=5

# POST /api/applications/{id}/update_status/
#   - Update application status with feedback
#   - Recruiter only
#   - Required: status, feedback_text
#   - Status options: pending, reviewed, accepted, rejected
#   - Feedback: max 1000 characters, required
#   - Creates/Updates ApplicationFeedback
#   - Example:
#     POST /api/applications/1/update_status/
#     Body: {
#       "status": "reviewed",
#       "feedback_text": "We reviewed your application..."
#     }

# GET /api/applications/{id}/applicant_profile/
#   - View full applicant profile
#   - Access: applicant or recruiter of job
#   - Returns: Full UserSerializer with profile
#   - Example: GET /api/applications/1/applicant_profile/

# GET /api/applications/{id}/feedback/
#   - Get feedback for application
#   - Access: applicant or recruiter of job
#   - Returns: ApplicationFeedbackSerializer
#   - Returns 404 if no feedback yet
#   - Example: GET /api/applications/1/feedback/

# GET /api/applications/status_summary/
#   - Get summary counts of applications
#   - Job seeker: sees their application counts
#   - Recruiter: sees counts for their jobs
#   - Returns: {
#       "total": 10,
#       "pending": 3,
#       "reviewed": 4,
#       "accepted": 2,
#       "rejected": 1
#     }
#   - Example: GET /api/applications/status_summary/
