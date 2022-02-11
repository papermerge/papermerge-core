from knox.models import AuthToken

from rest_framework_json_api import serializers


class TokenSerializer(serializers.ModelSerializer):
    """Serializer to list tokens"""
    token = serializers.CharField(max_length=256, required=False)

    class Meta:
        model = AuthToken
        resource_name = 'tokens'
        fields = ('token', 'digest', 'created', 'expiry')


class CreateTokenSerializer(serializers.Serializer):
    """Serializer to get input from user"""
    expiry_hours = serializers.IntegerField(default=744)
