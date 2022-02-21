import json
import logging

from django.contrib.auth.decorators import login_required
from django.http import (
    HttpResponseBadRequest,
    HttpResponseForbidden
)
from django.utils.translation import gettext as _
from django.core.exceptions import ValidationError
from django.core.cache import cache

from rest_framework_json_api.views import ModelViewSet

from papermerge.core.serializers import TagSerializer
from papermerge.core import validators
from papermerge.core.models import Access, BaseTreeNode, Tag

from .decorators import json_response
from .mixins import RequireAuthMixin

logger = logging.getLogger(__name__)


class TagsViewSet(RequireAuthMixin, ModelViewSet):
    serializer_class = TagSerializer

    def get_queryset(self, *args, **kwargs):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        tag = Tag(**serializer.data)
        tag.user_id = self.request.user.id
        tag.save()
