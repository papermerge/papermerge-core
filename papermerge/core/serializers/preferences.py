from dynamic_preferences.users.serializers import UserPreferenceSerializer


class CustomUserPreferenceSerializer(UserPreferenceSerializer):

    class Meta:
        resource_name = 'preferences'
        fields = [
            'default',
            'value',
            'verbose_name',
            'help_text',
        ]
