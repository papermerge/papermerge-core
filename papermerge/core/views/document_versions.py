import magic

from django.views.generic.detail import DetailView
from django.http import (
    Http404,
    HttpResponse
)

from papermerge.core.models import DocumentVersion


class DocumentVersionsDownloadView(DetailView):

    model = DocumentVersion

    def render_to_response(self, context, **response_kwargs):

        file_abs_path = self.object.abs_file_path()

        mime_type = magic.from_file(file_abs_path, mime=True)
        try:
            file_handle = open(file_abs_path, "rb")
        except OSError:
            raise Http404("Cannot open local version of the document")

        resp = HttpResponse(
            file_handle.read(),
            content_type=mime_type
        )
        disposition = "attachment; filename=%s" % self.object.document.title
        resp['Content-Disposition'] = disposition
        file_handle.close()

        return resp
