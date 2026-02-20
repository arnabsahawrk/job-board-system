"""
Custom Swagger/OpenAPI Documentation Helper
Centralized documentation for all API endpoints across the application
"""

from typing import Any

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema


# ============ COMMON RESPONSE SCHEMAS ============


class SuccessResponseSchema:
    """Common successful response schemas"""

    @staticmethod
    def message_response(message: str = "Operation successful"):
        return openapi.Response(
            message,
            openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "message": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
        )

    @staticmethod
    def created_response(description: str = "Resource created"):
        return openapi.Response(
            description,
            openapi.Schema(type=openapi.TYPE_OBJECT),
        )

    @staticmethod
    def list_response(item_schema, description: str = "List retrieved"):
        return openapi.Response(
            description,
            openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "count": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "next": openapi.Schema(type=openapi.TYPE_STRING, nullable=True),
                    "previous": openapi.Schema(type=openapi.TYPE_STRING, nullable=True),
                    "results": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=item_schema,
                    ),
                },
            ),
        )


class ErrorResponseSchema:
    """Common error response schemas"""

    @staticmethod
    def bad_request(detail: str = "Invalid request"):
        return openapi.Response(
            detail,
            openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "error": openapi.Schema(type=openapi.TYPE_STRING),
                    "detail": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
        )

    @staticmethod
    def unauthorized():
        return openapi.Response(
            "Unauthorized - Authentication required",
            openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "detail": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        default="Authentication credentials were not provided.",
                    ),
                },
            ),
        )

    @staticmethod
    def forbidden():
        return openapi.Response(
            "Forbidden - Permission denied",
            openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "detail": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        default="You do not have permission to perform this action.",
                    ),
                },
            ),
        )

    @staticmethod
    def not_found():
        return openapi.Response(
            "Not Found",
            openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "detail": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        default="Not found.",
                    ),
                },
            ),
        )


# ============ COMMON REQUEST SCHEMAS ============


class CommonRequestSchemas:
    """Common request body schemas"""

    @staticmethod
    def pagination_params():
        return [
            openapi.Parameter(
                "page",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Page number for pagination",
            ),
            openapi.Parameter(
                "page_size",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Number of items per page",
            ),
        ]

    @staticmethod
    def search_params():
        return [
            openapi.Parameter(
                "search",
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Search query for filtering",
            ),
        ]

    @staticmethod
    def ordering_params():
        return [
            openapi.Parameter(
                "ordering",
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description='Field name for ordering. Prefix with "-" for descending order',
            ),
        ]

    @staticmethod
    def filter_params(field_name: str, description: str):
        return openapi.Parameter(
            field_name,
            openapi.IN_QUERY,
            type=openapi.TYPE_STRING,
            description=description,
        )


# ============ DECORATOR FACTORY ============


class SwaggerDocumentation:
    """Factory for creating swagger auto_schema decorators"""

    @staticmethod
    def list_action(
        serializer_class: Any,
        description: str = "List items",
        filter_params: list[Any] | None = None,
        search_enabled: bool = True,
        ordering_enabled: bool = True,
    ):
        """Create swagger decorator for list actions"""
        manual_params: list[Any] = (
            list(filter_params) if filter_params is not None else []
        )

        if search_enabled:
            manual_params.append(
                openapi.Parameter(
                    "search",
                    openapi.IN_QUERY,
                    type=openapi.TYPE_STRING,
                    description="Search query",
                )
            )

        if ordering_enabled:
            manual_params.append(
                openapi.Parameter(
                    "ordering",
                    openapi.IN_QUERY,
                    type=openapi.TYPE_STRING,
                    description='Ordering field (prefix with "-" for descending)',
                )
            )

        manual_params.extend(CommonRequestSchemas.pagination_params())

        return swagger_auto_schema(
            method="get",
            manual_parameters=manual_params,
            responses={
                200: openapi.Response(
                    description,
                    openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "count": openapi.Schema(type=openapi.TYPE_INTEGER),
                            "next": openapi.Schema(
                                type=openapi.TYPE_STRING, nullable=True
                            ),
                            "previous": openapi.Schema(
                                type=openapi.TYPE_STRING, nullable=True
                            ),
                            "results": openapi.Schema(
                                type=openapi.TYPE_ARRAY,
                                # Keep a generic item object for editor/static type safety.
                                # Detailed serializer schema is still documented on non-list actions.
                                items=openapi.Schema(type=openapi.TYPE_OBJECT),
                            ),
                        },
                    ),
                ),
                400: ErrorResponseSchema.bad_request(),
            },
        )

    @staticmethod
    def create_action(
        request_serializer: Any,
        response_serializer: Any,
        description: str = "Create item",
    ):
        """Create swagger decorator for create actions"""
        return swagger_auto_schema(
            method="post",
            request_body=request_serializer,
            responses={
                201: openapi.Response(
                    description,
                    response_serializer,
                ),
                400: ErrorResponseSchema.bad_request("Invalid input data"),
                403: ErrorResponseSchema.forbidden(),
            },
        )

    @staticmethod
    def retrieve_action(
        serializer_class: Any,
        description: str = "Retrieve item",
    ):
        """Create swagger decorator for retrieve actions"""
        return swagger_auto_schema(
            method="get",
            responses={
                200: openapi.Response(description, serializer_class),
                404: ErrorResponseSchema.not_found(),
            },
        )

    @staticmethod
    def update_action(
        request_serializer: Any,
        response_serializer: Any,
        description: str = "Update item",
        partial: bool = False,
    ):
        """Create swagger decorator for update actions"""
        method = "patch" if partial else "put"

        return swagger_auto_schema(
            method=method,
            request_body=request_serializer,
            responses={
                200: openapi.Response(description, response_serializer),
                400: ErrorResponseSchema.bad_request("Invalid input data"),
                403: ErrorResponseSchema.forbidden(),
                404: ErrorResponseSchema.not_found(),
            },
        )

    @staticmethod
    def delete_action(
        description: str = "Delete item",
    ):
        """Create swagger decorator for delete actions"""
        return swagger_auto_schema(
            method="delete",
            responses={
                204: openapi.Response("Item deleted successfully"),
                403: ErrorResponseSchema.forbidden(),
                404: ErrorResponseSchema.not_found(),
            },
        )

    @staticmethod
    def custom_action(
        method: str,
        request_body: Any = None,
        response_schema: Any = None,
        description: str = "Custom action",
        manual_parameters: list[Any] | None = None,
    ):
        """Create swagger decorator for custom actions"""
        responses = {200: openapi.Response(description)}

        if response_schema:
            responses[200] = openapi.Response(description, response_schema)

        responses.update(
            {
                400: ErrorResponseSchema.bad_request(),
                403: ErrorResponseSchema.forbidden(),
                404: ErrorResponseSchema.not_found(),
            }
        )

        return swagger_auto_schema(
            method=method,
            request_body=request_body,
            responses=responses,
            manual_parameters=(
                manual_parameters if manual_parameters is not None else []
            ),
        )


# ============ PARAMETER SCHEMAS ============


class ParameterSchemas:
    """Pre-defined parameter schemas"""

    # Pagination
    PAGE = openapi.Parameter(
        "page",
        openapi.IN_QUERY,
        type=openapi.TYPE_INTEGER,
        description="Page number",
    )

    PAGE_SIZE = openapi.Parameter(
        "page_size",
        openapi.IN_QUERY,
        type=openapi.TYPE_INTEGER,
        description="Number of items per page",
    )

    # Search & Filter
    SEARCH = openapi.Parameter(
        "search",
        openapi.IN_QUERY,
        type=openapi.TYPE_STRING,
        description="Search query",
    )

    ORDERING = openapi.Parameter(
        "ordering",
        openapi.IN_QUERY,
        type=openapi.TYPE_STRING,
        description='Order by field (prefix with "-" for descending)',
    )

    # Auth
    CATEGORY = openapi.Parameter(
        "category",
        openapi.IN_QUERY,
        type=openapi.TYPE_STRING,
        description="Filter by category",
    )

    JOB_TYPE = openapi.Parameter(
        "job_type",
        openapi.IN_QUERY,
        type=openapi.TYPE_STRING,
        description="Filter by job type",
    )

    LOCATION = openapi.Parameter(
        "location",
        openapi.IN_QUERY,
        type=openapi.TYPE_STRING,
        description="Filter by location",
    )

    @staticmethod
    def id_param(name: str = "id"):
        return openapi.Parameter(
            name,
            openapi.IN_PATH,
            type=openapi.TYPE_INTEGER,
            description=f"{name} parameter",
        )


# ============ COMMON FIELD SCHEMAS ============


class FieldSchemas:
    """Pre-defined field schemas for reuse"""

    EMAIL = openapi.Schema(
        type=openapi.TYPE_STRING,
        format=openapi.FORMAT_EMAIL,
        description="Email address",
    )

    PASSWORD = openapi.Schema(
        type=openapi.TYPE_STRING,
        format=openapi.FORMAT_PASSWORD,
        description="Password (min 8 characters)",
    )

    TOKEN = openapi.Schema(
        type=openapi.TYPE_STRING,
        description="Authentication token",
    )

    UUID = openapi.Schema(
        type=openapi.TYPE_STRING,
        format="uuid",
        description="Unique identifier",
    )

    TIMESTAMP = openapi.Schema(
        type=openapi.TYPE_STRING,
        format="date-time",
        description="Timestamp",
    )

    URL = openapi.Schema(
        type=openapi.TYPE_STRING,
        format="uri",
        description="URL",
    )

    IMAGE = openapi.Schema(
        type=openapi.TYPE_STRING,
        format="binary",
        description="Image file",
    )

    FILE = openapi.Schema(
        type=openapi.TYPE_STRING,
        format="binary",
        description="File upload",
    )


# ============ API DOCUMENTATION CONSTANTS ============

API_TITLE = "Job Board System (Jobly) - API Documentation"
API_DESCRIPTION = """
Complete REST API for Job Board System (Jobly) built with Django REST Framework.

## Features:
- User Authentication & Authorization
- Job Posting & Management
- Application Management
- Review System
- Email Notifications

## Authentication:
Use JWT tokens in the Authorization header:
```
Authorization: JWT <access_token>
```

## Response Format:
All responses are in JSON format. Successful requests return appropriate HTTP status codes.

## Error Handling:
Errors return JSON with descriptive messages. Check the status code for error type.
"""

API_VERSION = "v1"

# Tag groups for organizing endpoints
TAGS = {
    "AUTH": "Authentication",
    "JOBS": "Jobs",
    "APPLICATIONS": "Applications",
    "REVIEWS": "Reviews",
    "USERS": "Users",
}
