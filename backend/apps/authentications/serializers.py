from djoser.serializers import (
    UserCreateSerializer as BaseUserCreateSerializer,
    UserSerializer as BaseUserSerializer,
)
from rest_framework import serializers
from apps.authentications.models import User, UserProfile


class UserCreateSerializer(BaseUserCreateSerializer):
    full_name = serializers.CharField(required=True)

    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "role",
            "password",
            "is_active",
        )


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = (
            "phone_number",
            "bio",
            "avatar",
        )


class UserSerializer(BaseUserSerializer):
    profile = UserProfileSerializer()

    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "role",
            "is_active",
            "profile",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("email", "role", "is_active", "created_at", "updated_at")
