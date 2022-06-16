from rest_framework_json_api.views import ModelViewSet

from papermerge.core.serializers import RoleSerializer
from papermerge.core.models import Role
from papermerge.core.auth import CustomModelPermissions
from .mixins import RequireAuthMixin


class RolesViewSet(RequireAuthMixin, ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [CustomModelPermissions]
