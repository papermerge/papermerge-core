from papermerge.core.models import Role

from rest_framework.serializers import ModelSerializer


class RoleSerializer(ModelSerializer):

    class Meta:
        model = Role
        resource_name = 'roles'
        fields = ('id', 'name', 'created_at', 'updated_at')