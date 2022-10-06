import magic

from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import RetrieveAPIView

from django.http import (
    Http404,
    HttpResponse
)

from papermerge.core.models import DocumentVersion
from papermerge.core.serializers import DocumentVersionSerializer
from .mixins import RequireAuthMixin


class DocumentVersionsDownloadView(RequireAuthMixin, APIView):

    def get(self, *args, **kwargs):
        doc_ver = self.get_object()

        file_abs_path = doc_ver.abs_file_path()

        mime_type = magic.from_file(file_abs_path, mime=True)
        try:
            file_handle = open(file_abs_path, "rb")
        except OSError:
            raise Http404("Cannot open local version of the document")

        resp = HttpResponse(
            file_handle.read(),
            content_type=mime_type
        )
        disposition = "attachment; filename=%s" % doc_ver.document.title
        resp['Content-Disposition'] = disposition
        file_handle.close()

        return resp

    def get_object(self):
        doc_ver = DocumentVersion.objects.get(
            pk=self.kwargs['pk']
        )
        if doc_ver.document.user != self.request.user:
            raise PermissionDenied

        return doc_ver


class DocumentVersionView(RequireAuthMixin, RetrieveAPIView):
    serializer_class = DocumentVersionSerializer

    def get_queryset(self):
        return DocumentVersion.objects.filter(
            document__user=self.request.user
        )
