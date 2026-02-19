from rest_framework.viewsets import ModelViewSet
from apps.jobs.models import Job


class JobViewSet(ModelViewSet):
    queryset = Job.objects.all()
