

from papermerge.core.models import Folder
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.renderers import JSONRenderer

from papermerge.core.serializers import FolderSerializer
from .mixins import RequireAuthMixin


class FoldersViewSet(RequireAuthMixin, ModelViewSet):
    """
    Folders endpoint
    """
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer
    renderer_classes = (JSONRenderer,)

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.pk)
