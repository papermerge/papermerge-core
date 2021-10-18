from django.contrib.auth.models import Permission

from rest_framework_json_api.serializers import ModelSerializer

from papermerge.core.models import Role
from .permission import PermissionSerializer


class RoleSerializer(ModelSerializer):

    included_serializers = {
        'permissions': PermissionSerializer,
    }

    class Meta:
        model = Role
        resource_name = 'roles'
        fields = (
            'id',
            'name',
            'permissions',
            'created_at',
            'updated_at'
        )

    class JSONAPIMeta:
        included_resources = ['permissions']

    def create(self, validated_data):
        perm_ids = [perm.id for perm in validated_data['permissions']]
        permissions = Permission.objects.filter(id__in=perm_ids)
        role = Role.objects.create(
            name=validated_data['name']
        )
        role.permissions.set(permissions)
        role.save()

        return role

    def update(self, instance, validated_data):
        perm_ids = [perm.id for perm in validated_data['permissions']]
        permissions = Permission.objects.filter(id__in=perm_ids)
        instance.permissions.set(permissions)
        instance.name = validated_data['name']
        instance.save()

        return instance
