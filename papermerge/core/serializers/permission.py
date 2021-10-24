from django.contrib.auth.models import Permission

from rest_framework_json_api import serializers

from .content_type import ContentTypeSerializer


class PermissionSerializer(serializers.ModelSerializer):

    included_serializers = {
        'content_type': ContentTypeSerializer,
    }

    class Meta:
        model = Permission
        resource_name = 'permissions'
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

    class JSONAPIMeta:
        included_resources = ['content_type']
