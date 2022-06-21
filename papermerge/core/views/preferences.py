from dynamic_preferences.users.viewsets import UserPreferencesViewSet
from dynamic_preferences.users.models import UserPreferenceModel
from papermerge.core.serializers import CustomUserPreferenceSerializer
from papermerge.core.auth import CustomModelPermissions


class CustomUserPreferencesViewSet(UserPreferencesViewSet):
    serializer_class = CustomUserPreferenceSerializer
    permission_classes = [CustomModelPermissions]

    def get_queryset(self):
        # This is workaround warning issued when runnnig
        # `./manage.py generateschema`
        # https://github.com/carltongibson/django-filter/issues/966
        if not self.request:
            return UserPreferenceModel.objects.none()

        return super().get_queryset()
