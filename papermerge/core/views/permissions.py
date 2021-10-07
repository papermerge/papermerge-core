from django.contrib.auth.models import Permission
from rest_framework import generics

from papermerge.core.serializers import PermissionSerializer


class PermissionsList(generics.ListCreateAPIView):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
