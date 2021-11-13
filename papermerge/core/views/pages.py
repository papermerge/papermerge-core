import os
import logging

from django.views.generic.detail import DetailView
from django.http import Http404

from rest_framework.response import Response
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.renderers import JSONRenderer

from papermerge.core.models import Page, Document
from papermerge.core.lib.pagecount import get_pagecount
from papermerge.core.storage import default_storage

from papermerge.core.serializers import PageSerializer
from papermerge.core.renderers import (
    PlainTextRenderer,
    ImageJpegRenderer,
    ImageSVGRenderer
)
from .mixins import RequireAuthMixin
from .mixins import HybridResponseMixin


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
        instance = self.get_object()

        # as plain text
        if request.accepted_renderer.format == 'txt':
            data = instance.text
            return Response(data)

        # as json
        if request.accepted_renderer.format == 'json':
            serializer = self.get_serializer(instance)
            return Response(serializer.data)

        # as svg (which includes embedded jpeg and HOCRed text overlay)
        if request.accepted_renderer.format == 'svg':
            data = instance.get_svg()
            return Response(data)

        try:
            jpeg_data = instance.get_jpeg()
        except IOError as exc:
            logger.error(exc)
            raise Http404("Jpeg image not available")

        # by default render page as binary jpeg image
        return Response(jpeg_data)


class HybridPageDetailView(HybridResponseMixin, DetailView):
    model = Document

    def render_to_response(self, context, **response_kwargs):
        if self.asks_for_svg:  # provided by HybridResponseMixin
            svg_image = self._get_page_svg()
            resp = self.render_to_svg_response(svg_image, **response_kwargs)
        else:
            resp = super().render_to_response(context, **response_kwargs)

        return resp

    def _get_page_svg(self):
        version = self.kwargs.get('version', 1)
        page_num = self.kwargs.get('page_num', -1)
        doc_path = self.object.path(version=version)
        doc_abs_path = default_storage.abspath(doc_path.url())

        page_count = get_pagecount(doc_abs_path)
        if page_num > page_count or page_num < 0:
            raise Http404("Page does not exists")

        page_path = self.object.get_page_path(
            page_num=page_num,
            version=version
        )
        svg_abs_path = default_storage.abspath(page_path.svg_url())

        if not os.path.exists(svg_abs_path):
            raise Http404("SVG data not yet ready")

        svg_text = ""
        with open(svg_abs_path, "r") as f:
            svg_text = f.read()

        return svg_text
