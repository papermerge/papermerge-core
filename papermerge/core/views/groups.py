from django.contrib.auth.models import Group
from rest_framework_json_api.views import ModelViewSet

from papermerge.core.serializers import GroupSerializer
from .mixins import RequireAuthMixin


class GroupsViewSet(RequireAuthMixin, ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
