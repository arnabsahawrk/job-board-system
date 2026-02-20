from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from typing import TYPE_CHECKING, cast
from apps.authentication.models import User, UserProfile, EmailVerification
from apps.core.validators import validate_file_size

if TYPE_CHECKING:
    from apps.authentication.models import UserManager


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with calculated experience years."""

    experience_years = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = (
            "phone_number",
            "bio",
            "avatar",
            "skills",
            "experience",
            "experience_years",
            "resume",
        )
        extra_kwargs = {
            "avatar": {"required": False, "allow_null": True},
            "resume": {"required": False, "allow_null": True},
            "experience": {"required": False, "allow_null": True},
        }

    def get_experience_years(self, obj):
        """
        Dynamically calculate years of experience from experience date.
        Returns float with 1 decimal place.
        """
        return obj.get_experience_years()

    def validate_experience(self, value):
        """
        Validate that experience date is not in the future.
        User cannot set experience date ahead of today.
        """
        if value and value > timezone.now().date():
            raise serializers.ValidationError(
                "Experience start date cannot be in the future"
            )
        return value

    def validate_avatar(self, value):
        """Validate avatar file if provided"""
        if value is None:
            return value

        # Check file size
        validate_file_size(value)

        # Check file extension
        allowed_extensions = ["jpg", "jpeg", "png"]
        file_name = value.name.lower()
        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                "Avatar must be an image file (JPG, PNG, JPEG)"
            )

        return value

    def validate_resume(self, value):
        """Validate resume file if provided"""
        if value is None:
            return value

        # Check file size
        validate_file_size(value)

        # Check file extension
        allowed_extensions = ["pdf", "doc", "docx"]
        file_name = value.name.lower()
        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                "Resume must be a document file (PDF, DOC, DOCX)"
            )

        return value


class UserDetailSerializer(serializers.ModelSerializer):
    """User detail with profile info"""

    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "role",
            "is_verified",
            "is_active",
            "profile",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "is_verified",
            "is_active",
            "created_at",
            "updated_at",
        )


class RegisterSerializer(serializers.ModelSerializer):
    """User registration serializer"""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("full_name", "email", "role", "password")

    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def validate_role(self, value):
        """Validate role is valid"""
        if value not in ["seeker", "recruiter"]:
            raise serializers.ValidationError('Role must be "seeker" or "recruiter"')
        return value

    def create(self, validated_data):
        """Create user and generate verification token"""
        password = validated_data.pop("password")
        manager = cast("UserManager", User.objects)

        user = manager.create_user(**validated_data)
        user.set_password(password)
        user.save()

        # Create profile
        UserProfile.objects.create(user=user)

        return user


class LoginSerializer(serializers.Serializer):
    """User login serializer"""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        """Authenticate user"""
        authenticated_user = authenticate(
            username=data["email"], password=data["password"]
        )

        if not authenticated_user:
            raise serializers.ValidationError("Invalid email or password")

        user = cast(User, authenticated_user)

        if not user.is_verified:
            raise serializers.ValidationError(
                "Please verify your email before logging in"
            )

        if not user.is_active:
            raise serializers.ValidationError("Account is inactive")

        data["user"] = user
        return data


class EmailVerificationSerializer(serializers.Serializer):
    """Email verification serializer"""

    token = serializers.CharField(required=True)

    def validate_token(self, value):
        """Validate verification token exists"""
        try:
            EmailVerification.objects.get(token=value, is_verified=False)
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired verification token")
        return value


class ResendVerificationEmailSerializer(serializers.Serializer):
    """Resend verification email serializer"""

    email = serializers.EmailField()

    def validate_email(self, value):
        """Check if user exists and not verified"""
        try:
            user = cast(User, User.objects.get(email=value))
            if user.is_verified:
                raise serializers.ValidationError("Email is already verified")
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Change password serializer"""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        """Validate old password is correct"""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class UpdateProfileSerializer(serializers.Serializer):
    """Update user profile serializer"""

    full_name = serializers.CharField(required=False, max_length=150)
    profile = UserProfileSerializer(required=False)

    def update(self, instance, validated_data):
        """Update user and profile"""

        # Update user fields
        if "full_name" in validated_data:
            instance.full_name = validated_data["full_name"]
            instance.save()

        # Update profile fields
        if "profile" in validated_data:
            profile_data = validated_data["profile"]
            profile = instance.profile

            # Handle resume file
            if "resume" in profile_data:
                resume_value = profile_data["resume"]
                if resume_value is None:
                    # Delete old resume file from Cloudinary
                    if profile.resume:
                        profile.resume.delete()
                    profile.resume = None
                else:
                    # Delete old resume before adding new one
                    if profile.resume:
                        profile.resume.delete()
                    profile.resume = resume_value

            # Handle avatar file
            if "avatar" in profile_data:
                avatar_value = profile_data["avatar"]
                if avatar_value is None:
                    # Delete old avatar file from Cloudinary
                    if profile.avatar:
                        profile.avatar.delete()
                    profile.avatar = None
                else:
                    # Delete old avatar before adding new one
                    if profile.avatar:
                        profile.avatar.delete()
                    profile.avatar = avatar_value

            # Validate experience date before updating
            if "experience" in profile_data:
                experience_value = profile_data["experience"]
                if experience_value and experience_value > timezone.now().date():
                    raise serializers.ValidationError(
                        {
                            "profile": {
                                "experience": "Experience start date cannot be in the future"
                            }
                        }
                    )

            # Update all other profile fields
            for attr, value in profile_data.items():
                if attr not in ["resume", "avatar"]:  # Skip files, already handled
                    setattr(profile, attr, value)

            # Call clean to trigger model validation
            profile.clean()
            profile.save()

        return instance
