from dynamic_preferences.users.viewsets import UserPreferencesViewSet

from papermerge.core.serializers import CustomUserPreferenceSerializer


class CustomUserPreferencesViewSet(UserPreferencesViewSet):
    serializer_class = CustomUserPreferenceSerializer
