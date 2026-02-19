from djoser.serializers import (
    UserCreateSerializer as BaseUserCreateSerializer,
    UserSerializer as BaseUserSerializer,
)
from rest_framework import serializers
from apps.authentication.models import User, UserProfile


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
            "skills",
            "experience_years",
        )


class UserSerializer(BaseUserSerializer):
    profile = UserProfileSerializer(required=False)

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

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if profile_data is not None:
            profile = getattr(instance, "profile", None)
            if profile is None:
                profile = UserProfile.objects.create(user=instance)

            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance
