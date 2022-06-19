from django.contrib.auth.models import Group, Permission

from rest_framework_json_api.serializers import ModelSerializer

from .permission import PermissionSerializer


class GroupSerializer(ModelSerializer):

    included_serializers = {
        'permissions': PermissionSerializer,
    }

    class Meta:
        model = Group
        resource_name = 'groups'
        fields = (
            'id',
            'name',
            'permissions',
        )

    class JSONAPIMeta:
        included_resources = ['permissions']

    def create(self, validated_data):
        perm_ids = [perm.id for perm in validated_data.get('permissions', [])]
        permissions = Permission.objects.filter(id__in=perm_ids)
        group = Group.objects.create(
            name=validated_data['name']
        )
        group.permissions.set(permissions)
        group.save()

        return group

    def update(self, instance, validated_data):
        perm_ids = [perm.id for perm in validated_data['permissions']]
        permissions = Permission.objects.filter(id__in=perm_ids)
        instance.permissions.set(permissions)
        instance.name = validated_data['name']
        instance.save()

        return instance
