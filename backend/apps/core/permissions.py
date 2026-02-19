from rest_framework.permissions import BasePermission


class IsRecruiterOrReadOnly(BasePermission):
    """
    Custom permission:
    - Allow any access to read (list, retrieve)
    - Only allow recruiters to create/update/delete
    """

    def has_permission(self, request, view):
        # Allow read permissions to any request
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Write permissions only for recruiters
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "recruiter"
        )

    def has_object_permission(self, request, view, obj):
        # Allow read permissions to any request
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Write permissions only for the recruiter who created the job
        return obj.recruiter == request.user
