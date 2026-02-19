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

# ============ CORE CRUD ============
# GET    /api/jobs/                    - List all jobs (anyone)
# POST   /api/jobs/                    - Create job (recruiter only)
# GET    /api/jobs/{id}/               - Job details (anyone)
# PATCH  /api/jobs/{id}/               - Update job (recruiter only)
# DELETE /api/jobs/{id}/               - Delete job (recruiter only)

# ============ CUSTOM ACTIONS ============
# GET    /api/jobs/my_jobs/            - My jobs (recruiter only)
# GET    /api/jobs/{id}/similar_jobs/  - Similar jobs (anyone)

# Query Parameters & Examples:
# /api/jobs/?category=it&location=NYC&job_type=remote
# /api/jobs/?search=python
# /api/jobs/?category=it&ordering=-salary
# /api/jobs/my_jobs/
# /api/jobs/5/similar_jobs/

# ============ DETAILED ENDPOINT DESCRIPTIONS ============

# GET /api/jobs/
#   - List all jobs
#   - Access: Anyone (no auth required)
#   - Filters:
#     - category: it, healthcare, finance, education, marketing, design, other
#     - job_type: full_time, part_time, remote, contract, internship
#     - location: string (city name)
#   - Search fields: title, company_name, description
#   - Ordering: created_at, salary (default: -created_at, newest first)
#   - Pagination: 10 items per page by default
#   - Returns: JobListSerializer (summary view)
#   - Example:
#     GET /api/jobs/
#     GET /api/jobs/?category=it&job_type=remote
#     GET /api/jobs/?search=django
#     GET /api/jobs/?location=NYC&salary_min=100000
#     GET /api/jobs/?ordering=-salary
#   - Response: {
#       "count": 50,
#       "next": "http://...",
#       "previous": null,
#       "results": [
#         {
#           "id": 1,
#           "title": "Senior Django Developer",
#           "company_name": "Tech Corp",
#           "company_logo_url": "https://...",
#           "location": "NYC",
#           "job_type": "remote",
#           "category": "it",
#           "salary": 150000,
#           "recruiter_name": "Jane Recruiter",
#           "created_at": "2026-02-17T10:00:00Z"
#         }
#       ]
#     }

# POST /api/jobs/
#   - Create new job
#   - Access: Recruiter only (must be authenticated with role='recruiter')
#   - Required fields:
#     - title (string, max 255)
#     - description (text)
#     - requirements (text)
#     - location (string, max 255)
#     - job_type (choices: full_time, part_time, remote, contract, internship)
#     - category (choices: it, healthcare, finance, education, marketing, design, other)
#     - company_name (string, max 255)
#   - Optional fields:
#     - salary (positive integer)
#     - experience_required (non-negative integer, default 0)
#     - position_count (positive integer, default 1)
#     - company_logo (image file)
#     - application_deadline (datetime)
#   - Validation:
#     - Salary must be positive if provided
#     - Experience required cannot be negative
#     - Position count must be at least 1
#   - Returns: JobDetailSerializer
#   - Example:
#     POST /api/jobs/
#     Headers: Authorization: Bearer TOKEN
#     Body: {
#       "title": "Senior Django Developer",
#       "description": "Looking for an experienced Django developer...",
#       "requirements": "5+ years Django, PostgreSQL, DRF",
#       "location": "NYC",
#       "job_type": "remote",
#       "category": "it",
#       "company_name": "Tech Corp",
#       "salary": 150000,
#       "experience_required": 5,
#       "position_count": 2,
#       "company_logo": <file>,
#       "application_deadline": "2026-03-17T23:59:59Z"
#     }

# GET /api/jobs/{id}/
#   - View job details
#   - Access: Anyone (no auth required)
#   - Returns: JobDetailSerializer (full information)
#   - Includes: recruiter info, company details, application deadline
#   - Example: GET /api/jobs/1/
#   - Response: {
#       "id": 1,
#       "title": "Senior Django Developer",
#       "description": "Looking for an experienced Django developer...",
#       "requirements": "5+ years Django, PostgreSQL, DRF",
#       "location": "NYC",
#       "job_type": "remote",
#       "category": "it",
#       "salary": 150000,
#       "experience_required": 5,
#       "position_count": 2,
#       "company_name": "Tech Corp",
#       "company_logo_url": "https://...",
#       "application_deadline": "2026-03-17T23:59:59Z",
#       "recruiter_name": "Jane Recruiter",
#       "recruiter_email": "jane@example.com",
#       "created_at": "2026-02-17T10:00:00Z",
#       "updated_at": "2026-02-17T10:00:00Z"
#     }

# PATCH /api/jobs/{id}/
#   - Update job details
#   - Access: Recruiter only (must be the recruiter who created the job)
#   - Can update any field (all are optional in PATCH)
#   - Returns: JobDetailSerializer
#   - Example:
#     PATCH /api/jobs/1/
#     Headers: Authorization: Bearer TOKEN
#     Body: {
#       "salary": 160000,
#       "position_count": 3
#     }

# DELETE /api/jobs/{id}/
#   - Delete job
#   - Access: Recruiter only (must be the recruiter who created the job)
#   - Deletes job and all associated applications
#   - Example: DELETE /api/jobs/1/
#   - Response: 204 No Content

# ============ CUSTOM ACTIONS ============

# GET /api/jobs/my_jobs/
#   - Get all jobs posted by current recruiter
#   - Access: Recruiter only (must be authenticated with role='recruiter')
#   - No parameters needed
#   - Returns: List of JobListSerializer
#   - Example: GET /api/jobs/my_jobs/
#   - Response: [
#       {
#         "id": 1,
#         "title": "Senior Django Developer",
#         "company_name": "Tech Corp",
#         "company_logo_url": "https://...",
#         "location": "NYC",
#         "job_type": "remote",
#         "category": "it",
#         "salary": 150000,
#         "recruiter_name": "Jane Recruiter",
#         "created_at": "2026-02-17T10:00:00Z"
#       },
#       {
#         "id": 2,
#         "title": "Python Backend Engineer",
#         ...
#       }
#     ]

# GET /api/jobs/{id}/similar_jobs/
#   - Get similar jobs based on category and location
#   - Access: Anyone (no auth required)
#   - Returns: Maximum 5 similar jobs
#   - Filters by: category AND location
#   - Excludes: current job from results
#   - Returns: List of JobListSerializer
#   - Example: GET /api/jobs/1/similar_jobs/
#   - Response: [
#       {
#         "id": 3,
#         "title": "Python Backend Engineer",
#         "company_name": "StartUp Inc",
#         "company_logo_url": "https://...",
#         "location": "NYC",
#         "job_type": "remote",
#         "category": "it",
#         "salary": 130000,
#         "recruiter_name": "Bob Recruiter",
#         "created_at": "2026-02-15T09:00:00Z"
#       },
#       ...
#     ]

# ============ USEFUL QUERY COMBINATIONS ============

# Search for Python jobs
# GET /api/jobs/?search=python

# Find remote IT jobs
# GET /api/jobs/?category=it&job_type=remote

# Find jobs in NYC with salary over 100k
# GET /api/jobs/?location=NYC&salary_min=100000

# Get latest jobs sorted by salary (highest first)
# GET /api/jobs/?ordering=-salary

# Find healthcare jobs in specific location
# GET /api/jobs/?category=healthcare&location=Boston

# Search for specific company jobs
# GET /api/jobs/?search=google

# Get jobs by type (internships)
# GET /api/jobs/?job_type=internship

# Combine multiple filters
# GET /api/jobs/?category=finance&job_type=full_time&location=NYC&ordering=-created_at

# ============ AUTHENTICATION ============

# No auth required for:
# - GET /api/jobs/
# - GET /api/jobs/{id}/
# - GET /api/jobs/{id}/similar_jobs/

# Auth required (Recruiter) for:
# - POST /api/jobs/
# - PATCH /api/jobs/{id}/
# - DELETE /api/jobs/{id}/
# - GET /api/jobs/my_jobs/

# Include Authorization header:
# Headers: {
#   "Authorization": "Bearer YOUR_TOKEN"
# }

# ============ RESPONSE CODES ============

# 200 OK
#   - GET requests successful
#   - PATCH requests successful

# 201 Created
#   - POST request successful

# 204 No Content
#   - DELETE request successful

# 400 Bad Request
#   - Invalid query parameters
#   - Invalid data in POST/PATCH

# 403 Forbidden
#   - Not authorized (not recruiter for write operations)
#   - Trying to update/delete someone else's job

# 404 Not Found
#   - Job doesn't exist

# 500 Internal Server Error
#   - Server error

# ============ FILTERING EXAMPLES ============

# By Category:
# /api/jobs/?category=it
# /api/jobs/?category=healthcare
# /api/jobs/?category=finance

# By Job Type:
# /api/jobs/?job_type=remote
# /api/jobs/?job_type=full_time
# /api/jobs/?job_type=internship

# By Location:
# /api/jobs/?location=NYC
# /api/jobs/?location=San+Francisco
# /api/jobs/?location=Remote

# Multiple Filters (AND operator):
# /api/jobs/?category=it&job_type=remote&location=NYC

# Ordering:
# /api/jobs/?ordering=-created_at (newest first, default)
# /api/jobs/?ordering=created_at (oldest first)
# /api/jobs/?ordering=-salary (highest salary first)
# /api/jobs/?ordering=salary (lowest salary first)

# Search:
# /api/jobs/?search=django
# /api/jobs/?search=python
# /api/jobs/?search=Tech+Corp

# Pagination:
# /api/jobs/?page=1
# /api/jobs/?page=2

# ============ FIELD REFERENCE ============

# Job Categories:
# - it: Information Technology
# - healthcare: Healthcare
# - finance: Finance
# - education: Education
# - marketing: Marketing
# - design: Design
# - other: Other

# Job Types:
# - full_time: Full-time
# - part_time: Part-time
# - remote: Remote
# - contract: Contract
# - internship: Internship

# Other Fields:
# - title: Job position title
# - description: Full job description
# - requirements: Required skills/qualifications
# - location: Job location
# - salary: Annual salary (in currency units)
# - experience_required: Minimum years of experience
# - position_count: Number of positions available
# - company_name: Hiring company name
# - company_logo: Company logo image
# - application_deadline: Last date to apply
# - created_at: When job was posted
# - updated_at: When job was last updated
