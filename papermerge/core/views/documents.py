import logging

from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import FileUploadParser
from rest_framework_json_api.views import ModelViewSet

from papermerge.core.serializers import DocumentDetailsSerializer
from papermerge.core.storage import default_storage
from papermerge.core.models import Document
from papermerge.core.tasks import (
    ocr_document_task,
    update_document_pages
)

from .mixins import RequireAuthMixin


logger = logging.getLogger(__name__)


class DocumentUploadView(RequireAuthMixin, APIView):
    parser_classes = [FileUploadParser]

    def put(self, request, document_id, file_name):
        payload = request.data['file']
        user_settings = request.user.preferences
        namespace = getattr(default_storage, 'namespace', None)

        doc = Document.objects.get(pk=document_id)
        doc.upload(payload=payload, file_name=file_name)

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
    serializer_class = DocumentDetailsSerializer
    queryset = Document.objects.all()

    http_method_names = [
        "get",
        "delete",
        "patch",
        "head",
        "options"
    ]
