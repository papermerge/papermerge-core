from django.contrib.auth.models import Permission, ContentType

from rest_framework_json_api import serializers


class PermissionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Permission
        resource_name = 'permission'
        fields = ('id', 'name', 'codename', 'content_type')
