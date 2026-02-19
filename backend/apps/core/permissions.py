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


class IsApplicantOrRecruiter(BasePermission):
    """
    Allow applicant to view/delete their own applications.
    Allow recruiter to view applications for their jobs.
    """

    def has_object_permission(self, request, view, obj):
        # Applicant can access their own applications
        if obj.applicant == request.user:
            return True

        # Recruiter can access applications for their jobs
        if obj.job.recruiter == request.user:
            return True

        return False


class IsRecruiter(BasePermission):
    """
    Allow only recruiters to access.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "recruiter"
        )


class IsJobSeeker(BasePermission):
    """
    Allow only job seekers to access.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "seeker"
        )


class CanUpdateApplicationStatus(BasePermission):
    """
    Allow only the recruiter who posted the job to update application status.
    """

    def has_object_permission(self, request, view, obj):
        return obj.job.recruiter == request.user
