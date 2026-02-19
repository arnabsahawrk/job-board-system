from django.contrib import admin
from django.urls import include, path, re_path
from config import settings
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions
from django.conf.urls.static import static
from django.views.static import serve


schema_view = get_schema_view(
    openapi.Info(
        title="Job Board System (Jobly) - API Documentation",
        default_version="v1",
        description=(
            "API documentation for Job Board System (Jobly) built with Django REST Framework. "
            "This documentation provides details on available endpoints, request/response formats, "
            "and authentication methods for developers integrating with the Jobly API."
        ),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path("api/", include("apps.authentication.urls")),
    path("api/", include("apps.jobs.urls")),
    path("api/", include("apps.applications.urls")),
    path("api/", include("apps.reviews.urls")),
]

urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += [
        path("admin/", admin.site.urls),
        path("__debug__/", include("debug_toolbar.urls")),
    ]
