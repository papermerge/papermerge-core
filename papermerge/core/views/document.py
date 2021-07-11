import magic

from django.views.generic.detail import DetailView
from django.http import (
    Http404,
    HttpResponse
)

from papermerge.core.storage import default_storage
from papermerge.core.models import Document
from .mixins import HybridResponseMixin


class DocumentDetailView(HybridResponseMixin, DetailView):
    model = Document

    def get_data(self, context):
        context = {}
        context['document'] = self.object.to_dict()

        return context

    def render_to_response(self, context, **response_kwargs):
        resp = self.render_to_json_response(context, **response_kwargs)

        return resp


class DocumentDownloadView(DetailView):
    model = Document

    def render_to_response(self, context, **response_kwargs):

        version = self.kwargs.get('version', 1)
        file_abs_path = default_storage.abspath(
            self.object.path().url(version=version)
        )
        mime_type = magic.from_file(file_abs_path, mime=True)
        try:
            file_handle = open(file_abs_path, "rb")
        except OSError:
            raise Http404("Cannot open local version of the document")

        resp = HttpResponse(
            file_handle.read(),
            content_type=mime_type
        )
        disposition = "attachment; filename=%s" % self.object.title
        resp['Content-Disposition'] = disposition
        file_handle.close()

        return resp
