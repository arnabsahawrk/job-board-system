from django.conf import settings
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from typing import cast
from drf_yasg import openapi
from apps.core.services import Services
from apps.core.swagger_docs import SwaggerDocumentation

from apps.authentication.models import User, EmailVerification
from apps.authentication.serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserDetailSerializer,
    EmailVerificationSerializer,
    ResendVerificationEmailSerializer,
    ChangePasswordSerializer,
    UpdateProfileSerializer,
)


class AuthViewSet(viewsets.GenericViewSet):
    """Authentication API endpoints"""

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def get_serializer_class(self):
        action_serializers: dict[str, type[serializers.Serializer]] = {
            "register": RegisterSerializer,
            "verify_email": EmailVerificationSerializer,
            "resend_verification": ResendVerificationEmailSerializer,
            "login": LoginSerializer,
            "update_profile": UpdateProfileSerializer,
            "change_password": ChangePasswordSerializer,
            "profile": UserDetailSerializer,
        }
        return action_serializers.get(self.action, self.serializer_class)

    @SwaggerDocumentation.create_action(
        request_serializer=RegisterSerializer,
        response_serializer=UserDetailSerializer,
        description="Register new user account",
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def register(self, request):
        """Register new user account. Sends verification email."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = cast(User, serializer.save())

        email_sent = Services.send_verification_email(user)

        if not email_sent:
            return Response(
                {
                    "message": "User created but email could not be sent. Try resending.",
                    "user_id": str(user.id),
                    "email": user.email,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "message": "Registration successful! Check your email to verify.",
                "user_id": str(user.id),
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )

    @SwaggerDocumentation.custom_action(
        method="post",
        request_body=EmailVerificationSerializer,
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={"message": openapi.Schema(type=openapi.TYPE_STRING)},
        ),
        description="Verify email",
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def verify_email(self, request):
        """Verify email address using token from verification email."""
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = cast(dict[str, object], serializer.validated_data or {})
        token = validated_data.get("token")
        if not isinstance(token, str):
            return Response(
                {"error": "Token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = EmailVerification.objects.get(token=token, is_verified=False)
            verification.mark_as_verified()

            user = verification.user
            user.is_verified = True
            user.save()

            Services.send_account_verified_email(user)

            return Response(
                {"message": "Email verified successfully!"}, status=status.HTTP_200_OK
            )

        except EmailVerification.DoesNotExist:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @SwaggerDocumentation.custom_action(
        method="post",
        request_body=ResendVerificationEmailSerializer,
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={"message": openapi.Schema(type=openapi.TYPE_STRING)},
        ),
        description="Resend verification email",
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def resend_verification(self, request):
        """Resend verification email to unverified user."""
        serializer = ResendVerificationEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = cast(dict[str, object], serializer.validated_data or {})
        email = validated_data.get("email")
        if not isinstance(email, str):
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.get(email=email)
        email_sent = Services.send_verification_email(user)

        if not email_sent:
            return Response(
                {"error": "Could not send email. Try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Verification email sent successfully!"},
            status=status.HTTP_200_OK,
        )

    @SwaggerDocumentation.custom_action(
        method="post",
        request_body=LoginSerializer,
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "access": openapi.Schema(type=openapi.TYPE_STRING),
                "refresh": openapi.Schema(type=openapi.TYPE_STRING),
                "user": openapi.Schema(type=openapi.TYPE_OBJECT),
            },
        ),
        description="Login user",
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def login(self, request):
        """Authenticate user and return JWT tokens."""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = cast(dict[str, object], serializer.validated_data or {})
        user = validated_data.get("user")
        if not isinstance(user, User):
            return Response(
                {"error": "Invalid login payload"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserDetailSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    @SwaggerDocumentation.custom_action(
        method="post",
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={"message": openapi.Schema(type=openapi.TYPE_STRING)},
        ),
        description="Logout user",
    )
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user (client deletes tokens)."""
        return Response(
            {
                "message": "Logged out successfully. Delete your tokens to complete logout."
            },
            status=status.HTTP_200_OK,
        )

    @SwaggerDocumentation.custom_action(
        method="post",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "email": openapi.Schema(
                    type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL
                ),
            },
            required=["email"],
        ),
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={"message": openapi.Schema(type=openapi.TYPE_STRING)},
        ),
        description="Request password reset",
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def request_password_reset(self, request):
        """Request password reset email (Step 1/2)."""
        email = request.data.get("email")

        if not isinstance(email, str):
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent account enumeration - generic response
        user = User.objects.filter(email=email, is_verified=True).first()

        if user is None:
            return Response(
                {
                    "message": "If an account with this email exists, a reset link has been sent."
                },
                status=status.HTTP_200_OK,
            )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        email_sent = Services.send_password_reset_email(user, reset_link)

        if not email_sent:
            return Response(
                {"error": "Could not send reset email. Try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "If an account with this email exists, a reset link has been sent."
            },
            status=status.HTTP_200_OK,
        )

    @SwaggerDocumentation.custom_action(
        method="post",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "uid": openapi.Schema(
                    type=openapi.TYPE_STRING, description="Base64 encoded user ID"
                ),
                "token": openapi.Schema(
                    type=openapi.TYPE_STRING, description="Password reset token"
                ),
                "new_password": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    format=openapi.FORMAT_PASSWORD,
                    description="New password (min 8 chars)",
                ),
            },
            required=["uid", "token", "new_password"],
        ),
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={"message": openapi.Schema(type=openapi.TYPE_STRING)},
        ),
        description="Confirm password reset",
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def confirm_password_reset(self, request):
        """Confirm password reset with token (Step 2/2)."""
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not (
            isinstance(uid, str)
            and isinstance(token, str)
            and isinstance(new_password, str)
        ):
            return Response(
                {"error": "uid, token, and new_password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"error": "New password must be at least 8 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_verified=True)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response(
                {"error": "Invalid reset token or user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password reset successful. You can now login."},
            status=status.HTTP_200_OK,
        )

    @SwaggerDocumentation.retrieve_action(
        serializer_class=UserDetailSerializer,
        description="Get current profile",
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get current user profile."""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @SwaggerDocumentation.update_action(
        request_serializer=UpdateProfileSerializer,
        response_serializer=UserDetailSerializer,
        description="Update current profile",
        partial=True,
    )
    @action(detail=False, methods=["patch"], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """Update user profile."""
        serializer = UpdateProfileSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        user = cast(User, serializer.save())

        return Response(UserDetailSerializer(user).data, status=status.HTTP_200_OK)

    @SwaggerDocumentation.custom_action(
        method="post",
        request_body=ChangePasswordSerializer,
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={"message": openapi.Schema(type=openapi.TYPE_STRING)},
        ),
        description="Change password",
    )
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change password for authenticated user."""
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        validated_data = cast(dict[str, object], serializer.validated_data or {})
        new_password = validated_data.get("new_password")
        if not isinstance(new_password, str):
            return Response(
                {"error": "New password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password changed successfully!"},
            status=status.HTTP_200_OK,
        )

    @SwaggerDocumentation.custom_action(
        method="post",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "refresh": openapi.Schema(
                    type=openapi.TYPE_STRING, description="Refresh token"
                ),
            },
            required=["refresh"],
        ),
        response_schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "access": openapi.Schema(
                    type=openapi.TYPE_STRING, description="New access token"
                )
            },
        ),
        description="Refresh access token",
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def refresh_token(self, request):
        """Refresh access token using refresh token."""
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"error": "Refresh token required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
            return Response(
                {"access": str(refresh.access_token)},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"error": "Invalid or expired refresh token. Please login again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
