import os

from django.views.generic.detail import DetailView
from django.http import Http404

from papermerge.core.models import Document
from papermerge.core.lib.pagecount import get_pagecount
from papermerge.core.storage import default_storage

from .mixins import HybridResponseMixin


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
