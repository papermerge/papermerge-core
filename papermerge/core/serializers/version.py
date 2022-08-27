from rest_framework import serializers as rest_serializers


class VersionSerializer(rest_serializers.Serializer):
    version = rest_serializers.CharField(max_length=32)
