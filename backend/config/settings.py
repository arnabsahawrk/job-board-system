from datetime import timedelta
import os
from pathlib import Path
import sys
import cloudinary
import dj_database_url
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, os.path.join(BASE_DIR, "apps"))


IS_VERCEL = os.environ.get("VERCEL") == "1"

SECRET_KEY = os.environ.get(
    "SECRET_KEY", "django-insecure-fallback-key-for-development-only"
)
DEBUG = os.environ.get("DEBUG", "True") == "True"

# ALLOWED_HOSTS configuration
if IS_VERCEL:
    ALLOWED_HOSTS = [
        "*.vercel.app",
        "jobly-backend.vercel.app",
        "localhost",
        "127.0.0.1",
    ]
else:
    ALLOWED_HOSTS = ["*"]

# CSRF and CORS configuration
if IS_VERCEL:
    CSRF_TRUSTED_ORIGINS = [
        "https://*.vercel.app",
        "https://jobly-backend.vercel.app",
    ]
else:
    CSRF_TRUSTED_ORIGINS = []

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://*.vercel.app",
]

INTERNAL_IPS = ["127.0.0.1"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "drf_yasg",
    "rest_framework",
    "django_filters",
    "cloudinary_storage",
    "cloudinary",
    "anymail",
    "apps.core",
    "apps.applications",
    "apps.authentication",
    "apps.jobs",
    "apps.reviews",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database configuration
if IS_VERCEL:
    # Production: Use PostgreSQL from environment variable
    DATABASES = {
        "default": dj_database_url.config(
            default=os.environ.get("DATABASE_URL"),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Development: Use SQLite
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

AUTH_USER_MODEL = "authentication.User"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files configuration
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Media files configuration
MEDIA_URL = "/media/"
if IS_VERCEL:
    # Temporary media storage on Vercel
    MEDIA_ROOT = "/tmp/media"
else:
    MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# Storage configuration
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Cloudinary configuration for production
if not DEBUG:
    STORAGES["default"] = {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    }

    cloudinary.config(
        cloud_name=os.environ.get("CLOUD_NAME"),
        api_key=os.environ.get("CLOUD_API_KEY"),
        api_secret=os.environ.get("CLOUD_API_SECRET"),
        secure=True,
    )

# REST Framework configuration
REST_FRAMEWORK = {
    "COERCE_DECIMAL_TO_STRING": False,
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

# JWT configuration
SIMPLE_JWT = {
    "AUTH_HEADER_TYPES": ("JWT",),
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
}

# Swagger configuration
SWAGGER_SETTINGS = {
    "SECURITY_DEFINITIONS": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Enter 'JWT <token>' to authenticate.",
        },
    },
    "DOC_EXPANSION": "none",
    "DEFAULT_MODEL_RENDERING": "model",
    "SHOW_REQUEST_HEADERS": True,
}

# Email configuration (Brevo/Anymail)
ANYMAIL = {
    "BREVO_API_KEY": os.environ.get("BREVO_API_KEY"),
}

DEFAULT_FROM_EMAIL = os.environ.get("BREVO_EMAIL", "noreply@jobly.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# Email backend
if IS_VERCEL or not DEBUG:
    EMAIL_BACKEND = "anymail.backends.brevo.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_SECURITY_POLICY = {
        "default-src": ("'self'",),
        "script-src": ("'self'", "'unsafe-inline'"),
        "style-src": ("'self'", "'unsafe-inline'"),
        "img-src": ("*",),
        "font-src": ("*",),
    }
    X_FRAME_OPTIONS = "DENY"
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Logging configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": os.path.join(BASE_DIR, "logs", "django.log"),
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# Development-only settings
if DEBUG:
    INSTALLED_APPS += [
        "debug_toolbar",
    ]

    MIDDLEWARE = [
        "debug_toolbar.middleware.DebugToolbarMiddleware",
    ] + MIDDLEWARE

    STORAGES["default"] = {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    }

    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
