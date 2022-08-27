from rest_framework.renderers import JSONRenderer as rest_framework_JSONRenderer
from rest_framework.parsers import JSONParser as rest_framework_JSONParser
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from papermerge.core.serializers import (
    VersionSerializer
)
from papermerge.core.version import __version__ as THE_VERSION

from .mixins import RequireAuthMixin


class VersionView(RequireAuthMixin, GenericAPIView):
    serializer_class = VersionSerializer
    parser_classes = (rest_framework_JSONParser,)
    renderer_classes = (rest_framework_JSONRenderer,)

    def get(self, request):
        """
        Retrieves papermerge core module version
        """
        return Response(data={'version': THE_VERSION})
