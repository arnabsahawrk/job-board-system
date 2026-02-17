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
        fields = ("id", "full_name", "email", "role", "password")


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("phone_number", "bio", "avatar")


class UserSerializer(BaseUserSerializer):
    profile = UserProfileSerializer(read_only=True)

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
