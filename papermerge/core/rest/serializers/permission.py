from django.contrib.auth.models import Permission

from rest_framework.serializers import ModelSerializer


class PermissionSerializer(ModelSerializer):

    class Meta:
        model = Permission
        resource_name = 'permission'
        fields = ('id', 'name', 'codename', 'content_type')
