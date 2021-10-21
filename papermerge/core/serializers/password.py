from rest_framework import serializers


class PasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=200)
