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

from papermerge.core.models import Page
from papermerge.core.lib.utils import get_assigns_after_delete
from papermerge.core.lib.path import PagePath
from papermerge.core.storage import default_storage
from papermerge.core.serializers import (
    PageSerializer,
    PageDeleteSerializer
)
from papermerge.core.renderers import (
    PlainTextRenderer,
    ImageJpegRenderer,
    ImageSVGRenderer
)
from .mixins import RequireAuthMixin


logger = logging.getLogger(__name__)


class PagesRemovalMixin:
    def reuse_ocr_data(self, old_version, new_version, pages_to_delete):
        """
        :param old_version: is instance of DocumentVersion
        :param new_version:  is instance of DocumentVersion
        :param pages_to_delete: queryset of pages to delete
        """
        # reuse OCRed data from previous version
        assigns = get_assigns_after_delete(
            total_pages=old_version.page_count,
            deleted_pages=[page.number for page in pages_to_delete]
        )
        for item in assigns:
            src_page_path = PagePath(
                document_path=old_version.document_path,
                page_num=item[1],
                page_count=old_version.page_count
            )
            dst_page_path = PagePath(
                document_path=new_version.document_path,
                page_num=item[0],
                page_count=old_version.page_count - pages_to_delete.count()
            )
            default_storage.copy_page(src=src_page_path, dst=dst_page_path)

    def remove_pdf_pages(self, old_version, new_version, pages_to_delete):
        """
        :param old_version: is instance of DocumentVersion
        :param new_version:  is instance of DocumentVersion
        :param pages_to_delete: queryset of pages to delete
        """
        # delete page from document's new version associated file
        pdf = Pdf.open(default_storage.abspath(old_version.document_path.url))
        _deleted_count = 0
        for page in pages_to_delete:
            pdf.pages.remove(p=page.number - _deleted_count)
            _deleted_count += 1

        dirname = os.path.dirname(
            default_storage.abspath(new_version.document_path.url))
        os.makedirs(dirname, exist_ok=True)
        pdf.save(default_storage.abspath(new_version.document_path.url))


class PageView(
    RequireAuthMixin,
    RetrieveAPIView,
    DestroyAPIView,
    PagesRemovalMixin
):
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

        self.remove_pdf_pages(
            old_version=old_version,
            new_version=new_version,
            pages_to_delete=pages_to_delete
        )

        self.reuse_ocr_data(
            old_version=old_version,
            new_version=new_version,
            pages_to_delete=pages_to_delete
        )


class PagesView(RequireAuthMixin, GenericAPIView, PagesRemovalMixin):
    serializer_class = PageDeleteSerializer

    def delete(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            # delete nodes with specified IDs
            self.delete_pages(page_ids=serializer.data['pages'])
            return Response(data=serializer.data, status=status.HTTP_200_OK)

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

        self.remove_pdf_pages(
            old_version=old_version,
            new_version=new_version,
            pages_to_delete=pages_to_delete
        )

        self.reuse_ocr_data(
            old_version=old_version,
            new_version=new_version,
            pages_to_delete=pages_to_delete
        )
