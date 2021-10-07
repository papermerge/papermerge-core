from rest_framework import generics
from rest_framework.renderers import BrowsableAPIRenderer

from papermerge.core.serializers import RoleSerializer
from papermerge.core.models import Role


class RolesList(generics.ListCreateAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class RoleDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
