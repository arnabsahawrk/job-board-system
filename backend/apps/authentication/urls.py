from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.authentication.views import AuthViewSet

router = DefaultRouter()
router.register(r"auth", AuthViewSet, basename="auth")

urlpatterns = [
    path("", include(router.urls)),
]

# Public Endpoints (No Auth Required)
# POST   /api/auth/register/              - Register new user
# POST   /api/auth/login/                 - Login & get JWT tokens
# POST   /api/auth/verify_email/          - Verify email with token
# POST   /api/auth/resend_verification/   - Resend verification email
# POST   /api/auth/request_password_reset/ - Request password reset email
# POST   /api/auth/confirm_password_reset/ - Confirm password reset with token
# POST   /api/auth/refresh_token/         - Get new access token

# Authenticated Endpoints (JWT Required)
# GET    /api/auth/profile/               - Get current user profile
# PATCH  /api/auth/update_profile/        - Update user profile
# POST   /api/auth/change_password/       - Change password
# POST   /api/auth/logout/                - Logout user
