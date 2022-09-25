import logging

from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer as rest_framework_JSONRenderer
from rest_framework.parsers import JSONParser as rest_framework_JSONParser
from rest_framework.generics import GenericAPIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import FileUploadParser
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.renderers import JSONRenderer
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter
)

from papermerge.core.serializers import (
    DocumentDetailsSerializer,
    DocumentsMergeSerializer,
    DocumentVersionOcrTextSerializer
)
from papermerge.core.models import Document
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

        doc = Document.objects.get(pk=document_id)
        doc.upload(
            payload=payload,
            file_path=payload.temporary_file_path(),
            file_name=file_name
        )

        return Response({}, status=status.HTTP_201_CREATED)


class DocumentOcrTextView(RequireAuthMixin, GenericAPIView):
    serializer_class = DocumentVersionOcrTextSerializer
    parser_classes = (rest_framework_JSONParser,)
    renderer_classes = (rest_framework_JSONRenderer,)
    queryset = Document.objects.all()

    @extend_schema(
        operation_id="Document OCR Text",
        parameters=[
            OpenApiParameter(
                name='page_numbers[]',
                description=(
                    "Filter pages by provided page numbers"
                ),
                required=False,
                type={'type': 'array', 'items': {'type': 'number'}}
            ),
            OpenApiParameter(
                name='page_ids[]',
                description=(
                    "Filter pages by provided page ids"
                ),
                required=False,
                type={'type': 'array', 'items': {'type': 'string'}}
            ),
        ]
    )
    def get(self, request, pk, *args, **kwargs):
        """Retrieve OCRed text of the document

        You can filter pages for which OCRed text is to be received either by
        page numbers or by page ids. When both filters are empty - retrieve
        OCRed text of the whole document (i.e. of its last document version)
        """

        # Document instance
        instance = self.get_object()
        document_version = instance.versions.last()
        # For what page number does user want to get OCR text ?
        # If page_numbers parameter is empty - get OCR text for all pages
        # of the document version
        try:
            page_numbers = self.request.GET.getlist('page_numbers[]', [])
            page_numbers = [int(number) for number in page_numbers]
        except ValueError:
            page_numbers = []

        page_ids = self.request.GET.getlist('page_ids[]', [])

        text = document_version.get_ocred_text(
            page_numbers=page_numbers,
            page_ids=page_ids
        )
        serializer = self.get_serializer(data={'text': text})

        if serializer.is_valid():
            return Response(data=serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


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
        For example, say you have two scans of the same document A_lq.pdf and
        A_hq.pdf where A_lq.pdf low quality scan and A_hq.pdf is high quality
        scan. You want to merge A_lq.pdf and A_hq.pdf document into one so
        that higher quality scan will be lastest version.
        In this case you need to set A_hq.pdf as source and A_lq.pdf as
        destination.

        Notice that OCR data (if any) is reused, this means that after
        merge operation you don't have to re-run OCR as the OCR data of the
        source document is reuse/copied to the target.
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
        page_count=src_version.pages.count(),
        short_description='document merge'
    )
    total_merge(
        src_old_version=src_version,
        dst_new_version=dst_new_version
    )
