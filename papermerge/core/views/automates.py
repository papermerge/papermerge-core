import logging

from rest_framework_json_api.views import ModelViewSet
from drf_spectacular.utils import extend_schema

from papermerge.core.models import Automate
from papermerge.core.serializers import AutomateSerializer
from .mixins import RequireAuthMixin

logger = logging.getLogger(__name__)


@extend_schema(exclude=True)
class AutomatesViewSet(RequireAuthMixin, ModelViewSet):
    serializer_class = AutomateSerializer

    def get_queryset(self, *args, **kwargs):
        return Automate.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        automate = Automate(**serializer.data)
        automate.user_id = self.request.user.id
        automate.save()
