import logging

from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import FileUploadParser
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.renderers import JSONRenderer
from drf_spectacular.utils import extend_schema

from papermerge.core.serializers import DocumentDetailsSerializer
from papermerge.core.storage import get_storage_instance
from papermerge.core.models import Document
from papermerge.core.tasks import (
    ocr_document_task,
    update_document_pages
)

from .mixins import RequireAuthMixin


logger = logging.getLogger(__name__)


class DocumentUploadView(RequireAuthMixin, APIView):
    parser_classes = [FileUploadParser]

    @extend_schema(operation_id="Upload file")
    def put(self, request, document_id, file_name):
        """
        Uploads a file for given document node. If last version of the
        document does not have any file associated yet, this REST API call
         will associated given file with document’s last version. If, on
        the other hand, last version of the document already has a file
        associated with it - a new document version will be created and
        associated it with respective file.

        Request body should contain file data. Please note that you need to
        specify ``Content-Disposition`` header with value
        'attachment; filename={file_name}'.
        """
        payload = request.data['file']
        user_settings = request.user.preferences
        namespace = getattr(get_storage_instance(), 'namespace', None)

        doc = Document.objects.get(pk=document_id)
        doc.upload(
            payload=payload,
            file_path=payload.temporary_file_path(),
            file_name=file_name
        )

        if user_settings['ocr__trigger'] == 'auto':
            ocr_document_task.apply_async(
                kwargs={
                    'document_id': doc.id,
                    'lang': doc.lang,
                    'namespace': namespace
                },
                link=update_document_pages.s(namespace)
            )

        return Response({}, status=status.HTTP_201_CREATED)


class DocumentDetailsViewSet(RequireAuthMixin, ModelViewSet):
    """
    Document details endpoint.
    """
    serializer_class = DocumentDetailsSerializer
    queryset = Document.objects.all()
    renderer_classes = (JSONRenderer,)

    http_method_names = [
        "get",
        "delete",
        "patch",
        "head",
        "options"
    ]
