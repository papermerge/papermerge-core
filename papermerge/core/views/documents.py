import logging

from kombu.exceptions import OperationalError

from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer as rest_framework_JSONRenderer
from rest_framework.parsers import JSONParser as rest_framework_JSONParser
from rest_framework.generics import GenericAPIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import FileUploadParser
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.renderers import JSONRenderer
from drf_spectacular.utils import extend_schema

from papermerge.core.serializers import (
    DocumentDetailsSerializer,
    DocumentsMergeSerializer
)
from papermerge.core.storage import get_storage_instance
from papermerge.core.models import Document
from papermerge.core.tasks import (
    ocr_document_task,
    update_document_pages,
    increment_document_version
)
from papermerge.core.exceptions import APIBadRequest

from .mixins import RequireAuthMixin
from .utils import total_merge


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
            try:
                ocr_document_task.apply_async(
                    kwargs={
                        'document_id': str(doc.id),
                        'lang': doc.lang,
                        'namespace': namespace,
                        'user_id': str(request.user.id)
                    },
                    link=[
                        increment_document_version.s(namespace),
                        update_document_pages.s(namespace)
                    ]
                )
            except OperationalError as ex:
                # If redis service is not available then:
                # - request is accepted
                # - document is uploaded
                # - warning is logged
                # - response includes exception message text
                logger.warning(
                    "Operation Error while creating the task",
                    exc_info=True
                )
                return Response(str(ex), status=status.HTTP_202_ACCEPTED)

        return Response({}, status=status.HTTP_201_CREATED)


class DocumentsMergeView(RequireAuthMixin, GenericAPIView):
    serializer_class = DocumentsMergeSerializer
    parser_classes = (rest_framework_JSONParser,)
    renderer_classes = (rest_framework_JSONRenderer,)

    @extend_schema(operation_id="Documents Merge")
    def post(self, request):
        """Merge source document into destination

        A new document version is created on the target (destination document)
        from all pages of the last version of the source.
        **Source document is deleted**.

        Merge operation is useful when you have same document scanned several
        times. Instead of keeping two similar scanned copies of the same
        document, better to merge them as two versions of the same document.
        """
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            _merge_documents(
                src_uuid=serializer.data['src'],
                dst_uuid=serializer.data['dst']
            )
            return Response(
                data=serializer.data,
                status=status.HTTP_204_NO_CONTENT
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


def _merge_documents(src_uuid, dst_uuid):
    try:
        src = Document.objects.get(pk=src_uuid)
    except Document.DoesNotExists:
        raise APIBadRequest(f"src={src_uuid} not found")

    try:
        dst = Document.objects.get(pk=dst_uuid)
    except Document.DoesNotExists:
        raise APIBadRequest(f"dst={dst_uuid} not found")

    src_version = src.versions.last()
    dst_new_version = dst.version_bump(
        page_count=src_version.pages.count()
    )
    total_merge(
        src_old_version=src_version,
        dst_new_version=dst_new_version
    )
