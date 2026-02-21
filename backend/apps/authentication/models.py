import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from cloudinary.models import CloudinaryField

# from django.core.validators import FileExtensionValidator
# from apps.core.validators import validate_file_size


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    ROLE_CHOICES = (
        ("seeker", "Job Seeker"),
        ("recruiter", "Recruiter"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)  # Email verified
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    phone_number = models.CharField(max_length=15, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    avatar = CloudinaryField(
        "image",
        blank=True,
        null=True,
        folder="profiles/avatars/",
        help_text="Profile avatar image (JPG, PNG)",
    )

    # avatar = models.ImageField(
    #     upload_to="avatars/",
    #     blank=True,
    #     null=True,
    # )

    skills = models.TextField(blank=True, null=True)

    experience = models.DateField(
        blank=True,
        null=True,
        help_text="Date when you started your professional experience",
    )

    resume = CloudinaryField(
        "document",
        blank=True,
        null=True,
        folder="profiles/resumes/",
        help_text="Upload your resume (PDF, DOC, DOCX)",
    )

    # resume = models.FileField(
    #     upload_to="profiles/resumes/",
    #     validators=[
    #         FileExtensionValidator(allowed_extensions=["pdf"]),
    #         validate_file_size,
    #     ],
    # )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} Profile"

    def get_experience_years(self):
        """
        Calculate years of experience from start date.
        Returns float rounded to 1 decimal place.
        Example: 5.3 years
        """
        if not self.experience:
            return 0

        today = timezone.now().date()
        days_difference = (today - self.experience).days
        years = days_difference / 365.25

        return round(years, 1)

    def clean(self):
        """Validate that experience date is not in the future"""
        if self.experience and self.experience > timezone.now().date():
            raise ValidationError(
                {"experience": "Experience start date cannot be in the future"}
            )


class EmailVerification(models.Model):
    """Track email verification tokens"""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="email_verification"
    )
    token = models.CharField(max_length=255, unique=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Email Verifications"

    def __str__(self):
        return f"Email verification for {self.user.email}"

    def mark_as_verified(self):
        """Mark email as verified"""
        self.is_verified = True
        self.verified_at = timezone.now()
        self.save()
