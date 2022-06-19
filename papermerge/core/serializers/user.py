from rest_framework_json_api import serializers

from papermerge.core.models import User
from .permission import PermissionSerializer
from .group import GroupSerializer


class UserSerializer(serializers.ModelSerializer):

    user_permissions = PermissionSerializer(many=True, read_only=True)

    included_serializers = {
        'groups': GroupSerializer
    }

    class Meta:
        model = User
        resource_name = 'users'
        fields = (
            'id',
            'username',
            'inbox_folder',
            'home_folder',
            'first_name',
            'last_name',
            'email',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
            'user_permissions',
            'groups',
        )
