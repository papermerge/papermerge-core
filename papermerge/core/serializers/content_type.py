from django.contrib.auth.models import ContentType

from rest_framework_json_api import serializers


class ContentTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = ContentType
        resource_name = 'content-types'
        fields = ('id', 'model',)
