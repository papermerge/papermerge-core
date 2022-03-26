import logging

from rest_framework_json_api.views import ModelViewSet

from papermerge.core.serializers import TagSerializer
from papermerge.core.models import Tag

from .mixins import RequireAuthMixin

logger = logging.getLogger(__name__)


class TagsViewSet(RequireAuthMixin, ModelViewSet):
    serializer_class = TagSerializer

    def get_queryset(self, *args, **kwargs):
        # This is workaround warning issued when runnnig
        # `./manage.py generateschema`
        # https://github.com/carltongibson/django-filter/issues/966
        if not self.request:
            return Tag.objects.none()

        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.id)
