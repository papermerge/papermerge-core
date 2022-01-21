from rest_framework import serializers
from dynamic_preferences.users.serializers import UserPreferenceSerializer


class CustomUserPreferenceSerializer(UserPreferenceSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        resource_name = 'preferences'
        fields = [
            'id',
            'default',
            'value',
            'verbose_name',
            'help_text',
        ]
