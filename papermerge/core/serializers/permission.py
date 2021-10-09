from django.contrib.auth.models import Permission

from rest_framework_json_api import serializers

from .content_type import ContentTypeSerializer


class PermissionSerializer(serializers.ModelSerializer):

    content_type = ContentTypeSerializer(read_only=True)

    class Meta:
        model = Permission
        resource_name = 'permission'
        fields = (
            'id',
            'name',
            'codename',
            'content_type',
        )
        read_only_fields = (
            'id',
            'name',
            'codename',
            'content_type'
        )
