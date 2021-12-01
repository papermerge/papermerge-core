import logging

from django.http import Http404

from rest_framework.response import Response
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.renderers import JSONRenderer

from papermerge.core.models import Page
from papermerge.core.serializers import PageSerializer
from papermerge.core.renderers import (
    PlainTextRenderer,
    ImageJpegRenderer,
    ImageSVGRenderer
)
from .mixins import RequireAuthMixin


logger = logging.getLogger(__name__)


class PagesViewSet(RequireAuthMixin, ModelViewSet):
    serializer_class = PageSerializer
    renderer_classes = [
        PlainTextRenderer,
        ImageSVGRenderer,
        JSONRenderer,
        ImageJpegRenderer,
    ]

    def get_queryset(self, *args, **kwargs):
        return Page.objects.filter(
            document_version__document__user=self.request.user
        )

    def retrieve(self, request, *args, **kwargs):
        """Returns page as json, txt, jpeg or svg image
        """
        instance = self.get_object()

        # as plain text
        if request.accepted_renderer.format == 'txt':
            data = instance.text
            return Response(data)

        # as html
        if request.accepted_renderer.format in ('html', 'jpeg', 'jpg'):
            try:
                jpeg_data = instance.get_jpeg()
            except IOError as exc:
                logger.error(exc)
                raise Http404("Jpeg image not available")
            return Response(jpeg_data)

        # as svg (which includes embedded jpeg and HOCRed text overlay)
        if request.accepted_renderer.format == 'svg':
            content_type = 'image/svg+xml'
            try:
                data = instance.get_svg()
            except IOError as exc:
                # svg not available, try jpeg
                try:
                    data = instance.get_jpeg()
                    content_type = 'image/jpeg'
                except IOError as exc:
                    logger.error(exc)
                    raise Http404("Neither JPEG nor SVG image not available")
            return Response(
                data,
                # either image/jpeg or image/svg+xml
                content_type=content_type
            )

        # by default render page with json serializer
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
