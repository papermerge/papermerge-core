import logging
from uuid import uuid4

from django.http import Http404

from rest_framework.generics import (
    RetrieveAPIView,
    DestroyAPIView,
    GenericAPIView
)

from rest_framework import status
from rest_framework.response import Response
from rest_framework_json_api.renderers import JSONRenderer
from rest_framework.parsers import JSONParser

from drf_spectacular.utils import extend_schema

from papermerge.core.models import Page, Document, Folder
from papermerge.core.lib.utils import (
    get_reordered_list,
    annotate_page_data
)
from papermerge.core.utils import clock

from papermerge.core.storage import get_storage_instance
from papermerge.core.serializers import (
    PageSerializer,
    PageDeleteSerializer,
    PagesReorderSerializer,
    PagesRotateSerializer,
    PagesMoveToDocumentSerializer,
    PagesMoveToFolderSerializer
)
from papermerge.core.renderers import (
    PlainTextRenderer,
    ImageJpegRenderer,
    ImageSVGRenderer
)
from papermerge.core.exceptions import APIBadRequest
from papermerge.core.signal_definitions import (
    page_move_to_folder,
    page_move_to_document,
    page_rotate,
    page_delete,
    page_reorder
)
from .mixins import RequireAuthMixin
from .utils import (
    remove_pdf_pages,
    insert_pdf_pages,
    total_merge,
    partial_merge,
    reuse_ocr_data,
    reuse_ocr_data_multi,
    reuse_text_field,
    reuse_text_field_multi,
    reorder_pdf_pages,
    rotate_pdf_pages,
    PageRecycleMap
)
from ..models.utils import OCR_STATUS_SUCCEEDED

logger = logging.getLogger(__name__)


def reuse_ocr_data_after_rotate(
    old_version,
    new_version,
    pages_data,
    pages_count
):
    pass


class PageView(RequireAuthMixin, RetrieveAPIView, DestroyAPIView):
    serializer_class = PageSerializer
    renderer_classes = [
        PlainTextRenderer,
        ImageSVGRenderer,
        JSONRenderer,
        ImageJpegRenderer,
    ]

    def get_queryset(self, *args, **kwargs):
        # This is workaround warning issued when runnnig
        # `./manage.py generateschema`
        # https://github.com/carltongibson/django-filter/issues/966
        if not self.request:
            return Page.objects.none()

        return Page.objects.filter(
            document_version__document__user=self.request.user
        )

    @extend_schema(operation_id="Retrieve")
    def get(self, request, *args, **kwargs):
        """
        Retrieves page resource
        """
        return self.retrieve(request, *args, **kwargs)

    @clock
    def retrieve(self, request, *args, **kwargs):
        """Returns page as json, txt, jpeg or svg image
        """
        instance = self.get_object()
        logger.debug(f"Retrieving page ID={instance.id}")
        # as plain text
        if request.accepted_renderer.format == 'txt':
            data = instance.text
            return Response(data)

        # as html
        if request.accepted_renderer.format in ('html', 'jpeg', 'jpg'):
            logger.debug(f"Page ID={instance.id} requested as html/jpeg/jpg")
            try:
                jpeg_data = instance.get_jpeg()
            except IOError as exc:
                logger.error(exc)
                raise Http404("Jpeg image not available")
            return Response(jpeg_data)

        # as svg (which includes embedded jpeg and HOCRed text overlay)
        if request.accepted_renderer.format == 'svg':
            logger.debug(f"Page ID={instance.id} requested svg")
            content_type = 'image/svg+xml'
            try:
                data = instance.get_svg()
            except IOError:
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
        logger.debug(f"Page ID={instance.id} renders default json serializer")

        return Response(serializer.data)

    @extend_schema(operation_id="Single page delete")
    def delete(self, request, *args, **kwargs):
        """
        Deletes page resource
        """
        return self.destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        """
        Creates a new document version and copies
        all existing pages to it except current page.
        """
        if instance.is_archived:
            raise APIBadRequest(detail='Deleting archived page is not allowed')

        pages_to_delete = Page.objects.filter(pk__in=[instance.pk])
        old_version = instance.document_version
        doc = instance.document_version.document

        # create new version models i.e. DocumentVersion with Page(s)
        new_version = doc.version_bump(
            page_count=old_version.page_count - 1
        )

        remove_pdf_pages(
            old_version=old_version,
            new_version=new_version,
            page_numbers=[page.number for page in pages_to_delete]
        )

        page_recycle_map = PageRecycleMap(
            total=old_version.page_count,
            deleted=[item.number for item in pages_to_delete]
        )

        page_map = list(page_recycle_map)

        reuse_ocr_data(
            old_version=old_version,
            new_version=new_version,
            page_map=page_map
        )

        reuse_text_field(
            old_version=old_version,
            new_version=new_version,
            page_map=page_map
        )

        page_delete.send(
            sender=Page,
            document_version=new_version
        )


class PagesView(RequireAuthMixin, GenericAPIView):
    serializer_class = PageDeleteSerializer

    @extend_schema(operation_id="Multiple pages delete")
    def delete(self, request):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            # delete nodes with specified IDs
            self.delete_pages(page_ids=serializer.data['pages'])
            return Response(
                data=serializer.data,
                status=status.HTTP_204_NO_CONTENT
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete_pages(self, page_ids):
        pages_to_delete = Page.objects.filter(pk__in=page_ids)

        first_page = pages_to_delete.first()

        for page in pages_to_delete:
            if page.is_archived:
                raise APIBadRequest(
                    detail='Deleting archived page is not allowed'
                )

        old_version = first_page.document_version

        count = old_version.pages.count()
        if count <= pages_to_delete.count():
            raise APIBadRequest(
                detail='Document version must have at least one page'
            )

        doc = old_version.document
        new_version = doc.version_bump(
            page_count=old_version.page_count - pages_to_delete.count()
        )

        remove_pdf_pages(
            old_version=old_version,
            new_version=new_version,
            page_numbers=[page.number for page in pages_to_delete]
        )

        page_recycle_map = PageRecycleMap(
            total=old_version.page_count,
            deleted=[item.number for item in pages_to_delete]
        )

        page_map = list(page_recycle_map)

        reuse_ocr_data(
            old_version=old_version,
            new_version=new_version,
            page_map=page_map
        )

        reuse_text_field(
            old_version=old_version,
            new_version=new_version,
            page_map=page_map
        )

        page_delete.send(
            sender=Page,
            document_version=new_version
        )


class PagesReorderView(RequireAuthMixin, GenericAPIView):
    parser_classes = [JSONParser]
    renderer_classes = (JSONRenderer,)
    serializer_class = PagesReorderSerializer

    @extend_schema(operation_id="Reorder")
    def post(self, request):
        """
        Reorders pages within document.
        """
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            # delete nodes with specified IDs
            self.reorder_pages(pages_data=serializer.data['pages'])
            return Response(
                data=serializer.data,
                status=status.HTTP_204_NO_CONTENT
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def reorder_pages(self, pages_data):
        pages = Page.objects.filter(
            pk__in=[item['id'] for item in pages_data]
        )
        old_version = pages.first().document_version

        doc = old_version.document
        new_version = doc.version_bump(
            page_count=old_version.page_count
        )

        page_count = old_version.pages.count()

        reorder_pdf_pages(
            old_version=old_version,
            new_version=new_version,
            pages_data=pages_data,
            page_count=page_count
        )

        reordered_list = get_reordered_list(
            pages_data=pages_data,
            page_count=page_count
        )

        reuse_ocr_data(
            old_version=old_version,
            new_version=new_version,
            page_map=list(
                zip(reordered_list, range(1, page_count + 1))
            )
        )

        reuse_text_field(
            old_version=old_version,
            new_version=new_version,
            page_map=list(
                zip(range(1, page_count + 1), reordered_list)
            )
        )

        page_reorder.send(
            sender=Page,
            document_version=new_version
        )


class PagesRotateView(RequireAuthMixin, GenericAPIView):
    parser_classes = [JSONParser]
    renderer_classes = (JSONRenderer,)
    serializer_class = PagesRotateSerializer

    @extend_schema(operation_id="Rotate")
    def post(self, request):
        """
        Rortates one or multiple pages with given angle.
        """
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            # delete nodes with specified IDs
            self.rotate_pages(pages_data=serializer.data['pages'])
            return Response(
                data=serializer.data,
                status=status.HTTP_204_NO_CONTENT
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def rotate_pages(self, pages_data):
        pages = Page.objects.filter(
            pk__in=[item['id'] for item in pages_data]
        )
        old_version = pages.first().document_version

        doc = old_version.document
        new_version = doc.version_bump()

        rotate_pdf_pages(
            old_version=old_version,
            new_version=new_version,
            pages_data=annotate_page_data(pages, pages_data, 'angle')
        )

        new_version.generate_previews()

        # page mapping is 1 to 1 as rotation does not
        # add/remove any page
        page_map = [
            (page.number, page.number)
            for page in old_version.pages.all()
        ]

        reuse_text_field(
            old_version=old_version,
            new_version=new_version,
            page_map=page_map
        )

        page_rotate.send(
            sender=Page,
            document_version=new_version
        )


class PagesMoveToFolderView(RequireAuthMixin, GenericAPIView):
    serializer_class = PagesMoveToFolderSerializer
    renderer_classes = (JSONRenderer,)

    @extend_schema(operation_id="Move to folder")
    def post(self, request):
        """
        Moves/extracts one or multiple pages into target folder.

        This operation will create new one or multiple documents (depending
        on ``single_page`` parameter) and place then into target folder.
        ``single_page`` parameter is boolean value which controls whether all
        extracted pages will be placed inside one single document or each
        individual page will be placed into newly created single page document.
        """
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            self.move_to_folder(serializer.data)
            return Response(
                data=serializer.data,
                status=status.HTTP_204_NO_CONTENT
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def move_to_folder(self, data):
        pages = Page.objects.filter(pk__in=data['pages'])
        dst_folder = Folder.objects.get(
            pk=data['dst'],
            user=self.request.user
        )
        first_page = pages.first()

        src_old_version = first_page.document_version

        if src_old_version.pages.count() <= 1:
            raise APIBadRequest(
                "Extracting last page of document is not allowed"
            )

        doc = src_old_version.document
        src_new_version = doc.version_bump(
            src_old_version.pages.count() - pages.count()
        )

        remove_pdf_pages(
            old_version=src_old_version,
            new_version=src_new_version,
            page_numbers=[page.number for page in pages]
        )

        page_recycle_map = PageRecycleMap(
            total=src_old_version.page_count,
            deleted=[item.number for item in pages]
        )

        page_map = list(page_recycle_map)

        reuse_ocr_data(
            old_version=src_old_version,
            new_version=src_new_version,
            page_map=page_map
        )
        reuse_text_field(
            old_version=src_old_version,
            new_version=src_new_version,
            page_map=page_map
        )

        if data['single_page']:
            # insert all pages in one single document
            self.move_to_folder_single_paged(
                pages=pages,
                dst_folder=dst_folder,
                title_format=data.get('title_format', None)
            )
        else:
            # there will be one document for each page
            self.move_to_folder_multi_paged(
                pages=pages,
                first_page=first_page,
                dst_folder=dst_folder,
                title_format=data.get('title_format', None)
            )

        page_move_to_folder.send(
            sender=Page,
            document_version=src_new_version
        )

    def move_to_folder_multi_paged(
            self,
            pages,
            first_page,
            dst_folder,
            title_format=None
    ):
        """All extracted pages are inserted into one document"""
        if title_format is None:
            title = f'document-{str(uuid4())}.pdf'
        else:
            title = f'{title_format}.pdf'

        new_doc = Document.objects.create_document(
            title=title,
            lang=first_page.lang,
            user_id=dst_folder.user_id,
            parent=dst_folder,
            ocr_status=OCR_STATUS_SUCCEEDED
        )
        # create new document version which
        # will contain mentioned pages
        dst_version = new_doc.version_bump_from_pages(pages=pages)
        page_map = zip(
            range(1, pages.count() + 1),
            [page.number for page in pages.order_by('number')]
        )
        for src_page, dst_page in zip(
            pages.order_by('number'),
            dst_version.pages.order_by('number'),
        ):
            get_storage_instance().copy_page(
                src=src_page.page_path,
                dst=dst_page.page_path
            )
        reuse_text_field(
            old_version=first_page.document_version,
            new_version=dst_version,
            page_map=page_map
        )

        page_move_to_folder.send(
            sender=Page,
            document_version=dst_version
        )

    def move_to_folder_single_paged(
            self,
            pages,
            dst_folder,
            title_format=None
    ):
        """Each extracted page is inserted into a separate document"""

        pages_count = pages.count()
        for page in pages:
            if title_format is None:
                title = f'page-{str(uuid4())}.pdf'
            else:
                if pages_count > 1:
                    title = f'{title_format}-{str(uuid4())}.pdf'
                else:
                    title = f'{title_format}.pdf'

            doc = Document.objects.create_document(
                title=title,
                lang=page.lang,
                user_id=dst_folder.user_id,
                parent=dst_folder,
                ocr_status=OCR_STATUS_SUCCEEDED
            )
            # create new document version
            # with one page
            doc_version = doc.version_bump_from_pages(pages=[page])
            get_storage_instance().copy_page(
                src=page.page_path,
                dst=doc_version.pages.first().page_path
            )
            reuse_text_field(
                old_version=page.document_version,
                new_version=doc_version,
                page_map=[(1, page.number)]
            )

            page_move_to_folder.send(
                sender=Page,
                document_version=doc_version
            )


class PagesMoveToDocumentView(RequireAuthMixin, GenericAPIView):
    serializer_class = PagesMoveToDocumentSerializer
    renderer_classes = (JSONRenderer,)

    @extend_schema(operation_id="Move to document")
    def post(self, request):
        """
        Moves one or multiple pages from source document to target document.

        Both source and target documents' version will be incremented
        by one.
        """
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            if serializer.data.get('merge', False):
                self.merge_to_document(serializer.data)
            else:
                self.move_to_document(serializer.data)
            return Response(
                data=serializer.data,
                status=status.HTTP_204_NO_CONTENT
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def merge_to_document(self, data):
        """Merge creates target document version ONLY from source pages

        There is a total merge and partial merge.
        Total merge is when ALL pages of the source are involved. During total
        merge source document is deleted.
        When not all pages are involved in the merge - we say it is a partial
        merge. During partial merge source documents is NOT deleted.
        """
        pages = Page.objects.filter(
            pk__in=data['pages']
        )
        dst_document = Document.objects.get(
            pk=data['dst'],
            user=self.request.user
        )
        src_old_version = pages.first().document_version
        doc = src_old_version.document
        pages_count = pages.count()

        if src_old_version.pages.count() == pages_count:
            # destination new version will have same
            # number of pages as source document count
            dst_new_version = dst_document.version_bump(
                page_count=pages_count,
                short_description=f'{pages_count} page(s) merged in'
            )
            total_merge(
                src_old_version=src_old_version,
                dst_new_version=dst_new_version
            )
            page_move_to_document.send(
                sender=Page,
                document_version=dst_new_version
            )
        else:
            src_new_version = doc.version_bump(
                page_count=src_old_version.pages.count() - pages_count,
                short_description=f'{pages_count} page(s) merged out'
            )
            dst_new_version = dst_document.version_bump(
                page_count=pages_count,
                short_description=f'{pages_count} page(s) merged in'
            )
            partial_merge(
                src_old_version=src_old_version,
                src_new_version=src_new_version,
                dst_new_version=dst_new_version,
                page_numbers=[p.number for p in pages.order_by('number')]
            )
            page_move_to_document.send(
                sender=Page,
                document_version=src_new_version
            )
            page_move_to_document.send(
                sender=Page,
                document_version=dst_new_version
            )

    def move_to_document(self, data):
        pages = Page.objects.filter(
            pk__in=data['pages']
        )
        dst_document = Document.objects.get(
            pk=data['dst'],
            user=self.request.user
        )
        src_old_version = pages.first().document_version
        dst_old_version = dst_document.versions.last()
        pages_count = pages.count()
        position = data['position']
        if position < 0:
            position = dst_old_version.pages.count()

        doc = src_old_version.document
        src_new_version = doc.version_bump(
            page_count=src_old_version.pages.count() - pages_count,
            short_description=f'{pages_count} page(s) moved out'
        )
        dst_new_version = dst_document.version_bump(
            page_count=dst_old_version.pages.count() + pages_count,
            short_description=f'{pages_count} page(s) moved in'
        )

        remove_pdf_pages(
            old_version=src_old_version,
            new_version=src_new_version,
            page_numbers=[page.number for page in pages]
        )

        page_recycle_map = PageRecycleMap(
            total=src_old_version.page_count,
            deleted=[item.number for item in pages]
        )

        page_map = list(page_recycle_map)

        reuse_ocr_data(
            old_version=src_old_version,
            new_version=src_new_version,
            page_map=page_map
        )

        reuse_text_field(
            old_version=src_old_version,
            new_version=src_new_version,
            page_map=page_map
        )

        insert_pdf_pages(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            src_page_numbers=[p.number for p in pages.order_by('number')],
            dst_position=position
        )

        reuse_ocr_data_multi(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            position=position,
            page_numbers=[page.number for page in pages]
        )

        reuse_text_field_multi(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            position=position,
            page_numbers=[page.number for page in pages]
        )

        page_move_to_document.send(
            sender=Page,
            document_version=src_new_version
        )

        page_move_to_document.send(
            sender=Page,
            document_version=dst_new_version
        )
