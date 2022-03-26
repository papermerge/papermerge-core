from dynamic_preferences.users.viewsets import UserPreferencesViewSet
from dynamic_preferences.users.models import UserPreferenceModel
from papermerge.core.serializers import CustomUserPreferenceSerializer


class CustomUserPreferencesViewSet(UserPreferencesViewSet):
    serializer_class = CustomUserPreferenceSerializer

    def get_queryset(self):
        # This is workaround warning issued when runnnig
        # `./manage.py generateschema`
        # https://github.com/carltongibson/django-filter/issues/966
        if not self.request:
            return UserPreferenceModel.objects.none()

        return super().get_queryset()
