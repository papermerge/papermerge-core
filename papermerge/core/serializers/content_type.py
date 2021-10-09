from django.contrib.auth.models import ContentType

from rest_framework_json_api import serializers


class ContentTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = ContentType
        fields = ('id', 'model',)

