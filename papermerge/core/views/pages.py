import os
import logging
from pikepdf import Pdf

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

from papermerge.core.models import Page, Document, Folder
from papermerge.core.lib.utils import (
    get_assigns_after_delete,
    get_reordered_list,
    annotate_page_data
)
from papermerge.core.lib.path import PagePath
from papermerge.core.storage import default_storage, abs
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
from .mixins import RequireAuthMixin


logger = logging.getLogger(__name__)


def copy_pages_data(old_version, new_version, pages_map):
    for src_page_number, dst_page_number in pages_map:
        src_page_path = PagePath(
            document_path=old_version.document_path,
            page_num=src_page_number
        )
        dst_page_path = PagePath(
            document_path=new_version.document_path,
            page_num=dst_page_number
        )
        default_storage.copy_page(src=src_page_path, dst=dst_page_path)


def reuse_ocr_data_after_delete(
        old_version,
        new_version,
        deleted_page_numbers
):
    """
    :param old_version: is instance of DocumentVersion
    :param new_version:  is instance of DocumentVersion
    :param deleted_page_numbers: a list of numbers
    """
    # reuse OCRed data from previous version
    assigns = get_assigns_after_delete(
        total_pages=old_version.page_count,
        deleted_pages=deleted_page_numbers
    )
    for item in assigns:
        src_page_path = PagePath(
            document_path=old_version.document_path,
            page_num=item[1]
        )
        dst_page_path = PagePath(
            document_path=new_version.document_path,
            page_num=item[0]
        )
        default_storage.copy_page(src=src_page_path, dst=dst_page_path)


def insert_pdf_pages(
        src_old_version,
        dst_old_version,
        dst_new_version,
        page_numbers,
        position
):
    src_old_pdf = Pdf.open(
        abs(src_old_version.document_path.url)
    )
    dst_old_pdf = Pdf.open(
        abs(dst_old_version.document_path.url)
    )

    _inserted_count = 0
    for page_number in page_numbers:
        pdf_page = src_old_pdf.pages.p(page_number)
        dst_old_pdf.pages.insert(position + _inserted_count, pdf_page)
        _inserted_count += 1

    dirname = os.path.dirname(
        abs(dst_new_version.document_path.url)
    )
    os.makedirs(dirname, exist_ok=True)
    dst_old_pdf.save(
        abs(dst_new_version.document_path.url)
    )


def remove_pdf_pages(old_version, new_version, pages_to_delete):
    """
    :param old_version: is instance of DocumentVersion
    :param new_version:  is instance of DocumentVersion
    :param pages_to_delete: queryset of pages to delete
    """
    # delete page from document's new version associated file
    pdf = Pdf.open(
        default_storage.abspath(old_version.document_path.url)
    )
    _deleted_count = 0
    for page in pages_to_delete:
        pdf.pages.remove(p=page.number - _deleted_count)
        _deleted_count += 1

    dirname = os.path.dirname(
        default_storage.abspath(new_version.document_path.url)
    )
    os.makedirs(dirname, exist_ok=True)
    pdf.save(default_storage.abspath(new_version.document_path.url))


def reuse_ocr_data_after_reorder(
    old_version,
    new_version,
    pages_data,
    page_count
):
    """
    :param old_version: is instance of DocumentVersion
    :param new_version:  is instance of DocumentVersion
    :param pages_data: a list of dictionary like objects. Each dictionary
    must have 'old_number' and 'new_number' keys.
    :param page_count: total number of pages in document version
    """
    reodered_list = get_reordered_list(
        pages_data=pages_data,
        page_count=page_count
    )
    for old_number, new_number in zip(
            range(1, page_count + 1),
            reodered_list
    ):
        src_page_path = PagePath(
            document_path=old_version.document_path,
            page_num=old_number
        )
        dst_page_path = PagePath(
            document_path=new_version.document_path,
            page_num=new_number
        )
        default_storage.copy_page(
            src=src_page_path,
            dst=dst_page_path
        )


def reorder_pdf_pages(
    old_version,
    new_version,
    pages_data,
    page_count
):
    src = Pdf.open(default_storage.abspath(old_version.document_path.url))

    dst = Pdf.new()
    reodered_list = sorted(pages_data, key=lambda item: item['new_number'])

    for list_item in reodered_list:
        page = src.pages.p(list_item['old_number'])
        dst.pages.append(page)

    dirname = os.path.dirname(
        abs(new_version.document_path.url)
    )
    os.makedirs(dirname, exist_ok=True)
    dst.save(abs(new_version.document_path.url))


def rotate_pdf_pages(
    old_version,
    new_version,
    pages_data
):
    """
    ``pages`` data is a list of dictionaries. Each dictionary is expected
    to have following keys:
        - number
        - angle
    """
    src = Pdf.open(default_storage.abspath(old_version.document_path.url))

    for page_data in pages_data:
        page = src.pages.p(page_data['number'])
        page.rotate(page_data['angle'], relative=True)

    dirname = os.path.dirname(
        default_storage.abspath(new_version.document_path.url)
    )
    os.makedirs(dirname, exist_ok=True)
    src.save(default_storage.abspath(new_version.document_path.url))


def reuse_ocr_data_after_rotate(
    old_version,
    new_version,
    pages_data,
    pages_count
):
    pass


class PageView(RequireAuthMixin, RetrieveAPIView, DestroyAPIView):
    """
    GET /pages/<pk>/
    DELETE /pages/<pk>/
    """
    serializer_class = PageSerializer
    renderer_classes = [
        PlainTextRenderer,
        ImageSVGRenderer,
        JSONRenderer,
        ImageJpegRenderer,
    ]

    def get_queryset(self, *args, **kwargs):
        return Page.objects.filter(
            document_version__document__user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Returns page as json, txt, jpeg or svg image
        """
        instance = self.get_object()

        # as plain text
        if request.accepted_renderer.format == 'txt':
            data = instance.text
            return Response(data)

        # as html
        if request.accepted_renderer.format in ('html', 'jpeg', 'jpg'):
            try:
                jpeg_data = instance.get_jpeg()
            except IOError as exc:
                logger.error(exc)
                raise Http404("Jpeg image not available")
            return Response(jpeg_data)

        # as svg (which includes embedded jpeg and HOCRed text overlay)
        if request.accepted_renderer.format == 'svg':
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
        return Response(serializer.data)

    def perform_destroy(self, instance):
        """
        Creates a new document version and copies
        all existing pages to it except current page.
        """
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
            pages_to_delete=pages_to_delete
        )

        reuse_ocr_data_after_delete(
            old_version=old_version,
            new_version=new_version,
            deleted_page_numbers=[item.number for item in pages_to_delete]
        )


class PagesView(RequireAuthMixin, GenericAPIView):
    serializer_class = PageDeleteSerializer

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
        old_version = pages_to_delete.first().document_version

        doc = old_version.document
        new_version = doc.version_bump(
            page_count=old_version.page_count - pages_to_delete.count()
        )

        remove_pdf_pages(
            old_version=old_version,
            new_version=new_version,
            pages_to_delete=pages_to_delete
        )

        reuse_ocr_data_after_delete(
            old_version=old_version,
            new_version=new_version,
            deleted_page_numbers=[item.number for item in pages_to_delete]
        )


class PagesReorderView(RequireAuthMixin, GenericAPIView):
    parser_classes = [JSONParser]
    serializer_class = PagesReorderSerializer

    def post(self, request):
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

        reuse_ocr_data_after_reorder(
            old_version=old_version,
            new_version=new_version,
            pages_data=pages_data,
            page_count=page_count
        )


class PagesRotateView(RequireAuthMixin, GenericAPIView):
    parser_classes = [JSONParser]
    serializer_class = PagesRotateSerializer

    def post(self, request):
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
        new_version = doc.version_bump(
            page_count=old_version.page_count
        )

        rotate_pdf_pages(
            old_version=old_version,
            new_version=new_version,
            pages_data=annotate_page_data(pages, pages_data, 'angle')
        )


class PagesMoveToFolderView(RequireAuthMixin, GenericAPIView):
    serializer_class = PagesMoveToFolderSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            self.move_to_folder(serializer.data)
            return Response(
                data=serializer.data,
                status=status.HTTP_204_NO_CONTENT
            )

    def move_to_folder(self, data):
        pages = Page.objects.filter(pk__in=data['pages'])
        dst_folder = Folder.objects.get(
            pk=data['dst'],
            user=self.request.user
        )
        first_page = pages.first()

        if data['single_page']:
            # insert all pages in one single document
            doc = Document.objects.create_document(
                title='noname.pdf',
                lang=first_page.lang,
                user_id=dst_folder.user_id,
                parent=dst_folder
            )
            # create new document version which
            # will contain mentioned pages
            doc.version_bump_from_pages(pages=pages)
        else:
            # there will be one document for each page
            for page in pages:
                doc = Document.objects.create_document(
                    title=f'noname-{page.pk}.pdf',
                    lang=page.lang,
                    user_id=dst_folder.user_id,
                    parent=dst_folder
                )
                # create new document version
                # with one page
                doc.version_bump_from_pages(pages=[page])


class PagesMoveToDocumentView(RequireAuthMixin, GenericAPIView):
    serializer_class = PagesMoveToDocumentSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            self.move_to_document(serializer.data)
            return Response(
                data=serializer.data,
                status=status.HTTP_204_NO_CONTENT
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

        doc = src_old_version.document
        src_new_version = doc.version_bump(
            page_count=src_old_version.pages.count() - pages.count()
        )
        dst_new_version = dst_document.version_bump(
            page_count=dst_old_version.pages.count() + pages.count()
        )

        remove_pdf_pages(
            old_version=src_old_version,
            new_version=src_new_version,
            pages_to_delete=pages
        )

        reuse_ocr_data_after_delete(
            old_version=src_old_version,
            new_version=src_new_version,
            deleted_page_numbers=[item.number for item in pages]
        )

        insert_pdf_pages(
            src_old_version=src_old_version,
            dst_old_version=dst_old_version,
            dst_new_version=dst_new_version,
            page_numbers=[p.number for p in pages.order_by('number')],
            position=data['position']
        )

        copy_pages_data(
            old_version=dst_old_version,
            new_version=dst_new_version,
            pages_map=[
                (p.number, p.number + data['position'])
                for p in pages.order_by('number')
            ]
        )
