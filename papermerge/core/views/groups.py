from django.contrib.auth.models import Group
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.renderers import JSONRenderer
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from papermerge.core.serializers.group import (
    GroupSerializer,
    Data_GroupSerializer
)
from papermerge.core.auth import CustomModelPermissions
from .mixins import RequireAuthMixin


class GroupsViewSet(RequireAuthMixin, ModelViewSet):
    """
    Group endpoint
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    renderer_classes = (JSONRenderer,)
    permission_classes = [CustomModelPermissions]

    @extend_schema(
        responses={201: Data_GroupSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
