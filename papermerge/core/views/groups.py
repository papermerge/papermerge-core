from django.contrib.auth.models import Group
from rest_framework import generics
from rest_framework_json_api.views import ModelViewSet

from papermerge.core.serializers import GroupSerializer


class GroupsViewSet(ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
