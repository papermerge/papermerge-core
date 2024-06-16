import io
import logging
import os
from os.path import getsize
from pathlib import Path
from typing import Optional

import img2pdf
from django.db import models, transaction
from pikepdf import Pdf

from papermerge.core import constants as const
from papermerge.core.lib.path import DocumentPath, PagePath
from papermerge.core.lib.storage import copy_file
from papermerge.core.models import utils
from papermerge.core.pathlib import (abs_docver_path, abs_thumbnail_path,
                                     rel2abs, thumbnail_path)
from papermerge.core.signal_definitions import document_post_upload
from papermerge.core.storage import abs_path
from papermerge.core.utils import image as image_utils

from .document_version import DocumentVersion
from .node import BaseTreeNode
from .page import Page

logger = logging.getLogger(__name__)


class UploadStrategy:
    """
    Defines how to proceed with uploaded file
    """
    # INCREMENT - Uploaded file is inserted into the newly created
    #   document version
    INCREMENT = 1
    # MERGE - Uploaded file is merged with last file version
    #   and inserted into the newly created document version
    MERGE = 2


class UploadContentType:
    PDF = "application/pdf"
    JPEG = "image/jpeg"
    PNG = "image/png"
    TIFF = "image/tiff"


class FileType:
    PDF = "pdf"
    JPEG = "jpeg"
    PNG = "png"
    TIFF = "tiff"


def get_pdf_page_count(content: io.BytesIO | bytes) -> int:
    if isinstance(content, bytes):
        pdf = Pdf.open(io.BytesIO(content))
    else:
        pdf = Pdf.open(content)
    page_count = len(pdf.pages)
    pdf.close()

    return page_count


def create_next_version(doc, file_name, file_size, short_description=None):
    document_version = doc.versions.filter(size=0).last()

    if not document_version:
        document_version = DocumentVersion(
            document=doc,
            number=doc.versions.count() + 1,
            lang=doc.lang
        )

    document_version.file_name = file_name
    document_version.size = file_size
    document_version.page_count = 0
    if short_description:
        document_version.short_description = short_description

    document_version.save()

    return document_version


def file_type(content_type: UploadContentType) -> FileType:
    parts = content_type.split('/')
    if len(parts) == 2:
        return parts[1]

    raise ValueError(f"Invalid content type {content_type}")


class DocumentManager(models.Manager):

    @transaction.atomic
    def create_document(
        self,
        title,
        lang,
        size=0,
        page_count=0,
        file_name=None,
        parent=None,
        id=None,
        **kwargs
    ):
        attrs = dict(
            title=title,
            lang=lang,
            parent=parent,
            **kwargs
        )
        if id is not None:
            attrs['id'] = id

        doc = Document(**attrs)
        doc.save()

        document_version = DocumentVersion(
            document=doc,
            number=1,  # versioning number starts with 1
            file_name=file_name,
            size=0,
            page_count=0,
            lang=lang,
            short_description="Original"
        )
        document_version.save()
        # Important! - first document must inherit metakeys from
        # parent folder
        # if parent:
        #    doc.inherit_kv_from(parent)
        return doc

    def _get_parent(self, parent_id):
        """
        Returns parent node instance based on ``parent_id``
        """
        parent = None

        if parent_id is None or parent_id == '':
            parent = None
        else:
            try:
                parent = BaseTreeNode.objects.get(id=parent_id)
            except BaseTreeNode.DoesNotExist:
                parent = None

        return parent


class DocumentQuerySet(models.QuerySet):
    def get_by_breadcrumb(self, breadcrumb: str, user):
        return utils.get_by_breadcrumb(
            Document,
            breadcrumb,
            user
        )


CustomDocumentManager = DocumentManager.from_queryset(DocumentQuerySet)


class Document(BaseTreeNode):

    # Will this document be OCRed?
    # If True this document will be OCRed
    # If False, OCR operation will be skipped for this document
    ocr = models.BooleanField(default=True)
    ocr_status = models.CharField(
        choices=utils.OCR_STATUS_CHOICES,
        default=utils.OCR_STATUS_UNKNOWN,
        max_length=32
    )

    objects = CustomDocumentManager()

    @property
    def idified_title(self):
        """
        Returns a title with ID part inserted before extension

        Example:
            input: title="invoice.pdf", id="233453"
            output: invoice-233453.pdf
        """
        base_title_arr = self.title.split('.')[:-1]
        base_title = '.'.join(base_title_arr)
        ext = self.title.split('.')[-1]

        return f'{base_title}-{self.id}.{ext}'

    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def upload(
            self,
            content: io.BytesIO,
            size: int,
            file_name: str,
            content_type: UploadContentType = UploadContentType.PDF,
            strategy=UploadStrategy.INCREMENT
    ):
        """
        Associates payload with specific document version.

        If the document has zero sized document version, it will associate
        payload with that (existing) version, otherwise it will create
        new document version and associate it the payload.
        """
        logger.info(f"Uploading document {file_name}...")
        if content_type != UploadContentType.PDF:
            with open(f"{file_name}.pdf", "wb") as f:
                pdf_content = img2pdf.convert(content)
                f.write(pdf_content)

            orig_ver = create_next_version(
                doc=self,
                file_name=file_name,
                file_size=size
            )

            pdf_ver = create_next_version(
                doc=self,
                file_name=f'{file_name}.pdf',
                file_size=len(pdf_content),
                short_description=f"{file_type(content_type)} -> pdf"
            )

            copy_file(
                src=content,
                dst=abs_docver_path(orig_ver.id, orig_ver.file_name)
            )

            copy_file(
                src=pdf_content,
                dst=abs_docver_path(pdf_ver.id, pdf_ver.file_name)
            )

            page_count = get_pdf_page_count(pdf_content)
            orig_ver.page_count = page_count
            orig_ver.save()
            pdf_ver.page_count = page_count
            pdf_ver.save()

            orig_ver.create_pages()
            pdf_ver.create_pages()
        else:
            # pdf_ver == orig_ver
            pdf_ver = create_next_version(
                doc=self,
                file_name=file_name,
                file_size=size
            )
            copy_file(
                src=content,
                dst=abs_docver_path(pdf_ver.id, pdf_ver.file_name)
            )

            page_count = get_pdf_page_count(content)
            pdf_ver.page_count = page_count
            pdf_ver.save()

            pdf_ver.create_pages()

        document_post_upload.send(
            sender=self.__class__,
            document_version=pdf_ver
        )

        return pdf_ver

    def version_bump_from_pages(self, pages):
        """
        Creates new version for the document.
        PDF pages in the newly create document version is copied
        from ``pages``.

        ``pages`` is an iterable. Maybe either Page queryset or
        a list of ``Page`` model instances. Used when extracting/moving
        pages from the document to folder (thus creating new document).
        """
        if isinstance(pages, list):
            first_page = pages[0]
            page_count = len(pages)
        else:  # pages queryset
            first_page = pages.first()
            page_count = pages.count()
        source_pdf = Pdf.open(
            first_page.document_version.file_path
        )
        dst_pdf = Pdf.new()

        document_version = self.versions.filter(size=0).last()

        if not document_version:
            document_version = DocumentVersion(
                document=self,
                number=self.versions.count(),
                lang=self.lang
            )

        for page in pages:
            pdf_page = source_pdf.pages.p(page.number)
            dst_pdf.pages.append(pdf_page)

        document_version.file_name = first_page.document_version.file_name
        document_version.page_count = page_count
        document_version.save()

        dirname = os.path.dirname(
            document_version.file_path
        )
        os.makedirs(dirname, exist_ok=True)

        dst_pdf.save(document_version.file_path)

        document_version.size = getsize(
            document_version.file_path
        )
        document_version.save()

        document_version.create_pages()
        source_pdf.close()
        dst_pdf.close()

        return document_version

    def version_bump(
        self,
        page_count=None,
        short_description: Optional[str] = ''
    ):
        """
        Increment document's version.

        Creates new document version (old version = old version + 1) and
        copies all attributes from current document version.
        If ``page_count`` is not None new document version will
        have ``page_count`` pages (useful when page was deleted or number of
        new pages were merged into the document).
        If ``page_count`` is None new version will have same number of pages as
        previous document (useful when new document was OCRed or
        when pages were rotated)
        """
        last_doc_version = self.versions.last()
        new_page_count = last_doc_version.page_count
        if page_count:
            new_page_count = page_count

        new_doc_version = DocumentVersion(
            document=self,
            number=last_doc_version.number + 1,
            file_name=last_doc_version.file_name,
            size=0,  # TODO: set to newly created file size
            page_count=new_page_count,
            short_description=short_description,
            lang=last_doc_version.lang
        )
        new_doc_version.save()

        for page_number in range(1, new_page_count + 1):
            Page.objects.create(
                document_version=new_doc_version,
                number=page_number,
                page_count=new_page_count,
                lang=last_doc_version.lang
            )

        return new_doc_version

    def __repr__(self):
        return f"Document(id={self.pk}, title={self.title})"

    def __str__(self):
        return self.title

    @property
    def files_iter(self):
        """Yields folders where associated files with this instance are"""
        for doc_ver in self.versions.all():
            for page in doc_ver.pages.all():
                # folder path to ocr related files
                yield page.svg_path.parent
                # folder path to preview files
                yield abs_thumbnail_path(page.id).parent

            # folder path to file associated with this doc ver
            yield doc_ver.file_path.parent

    @property
    def file_ext(self):
        _, ext = os.path.splitext(self.file_name)
        return ext

    @property
    def absfilepath(self):
        return abs_path(
            self.path().url()
        )

    def path(self, version=None):

        if version is None:
            version = self.version

        version = int(version)
        result = DocumentPath(
            user_id=self.user.id,
            document_id=self.id,
            version=version,
            file_name=self.file_name,
        )

        return result

    def page_paths(self, version=None):
        """
        Enables document instance to get quickly page
        paths:

            page_path = doc.page_path[2]
            page_path.url() # local url to second page of the doc.

        This is shortcut method when most used Step(1) is required.
        """

        results = [None]  # indexing starts from 1

        page_count = self.get_pagecount(version=version)

        for page_num in range(1, page_count + 1):
            page_path = PagePath(
                document_path=self.path(version=version),
                page_num=page_num,
                page_count=self.get_pagecount(version=version)
            )
            results.append(page_path)

        return results

    def get_page_path(self, page_num, version=None):
        return PagePath(
            document_path=self.path(version=version),
            page_num=page_num,
            page_count=self.page_count
        )

    def generate_thumbnail(
        self,
        size: int = const.DEFAULT_THUMBNAIL_SIZE
    ) -> Path:
        """Generates thumbnail image for the document

        The thumbnail is generated from the first page of the
        last version of document.

        The local path to the generated thumbnail will be
        /<MEDIA_ROOT>/thumbnails/<splitted document version uuid>/<size>.jpg

        splitted DOCUMENT VERSION UUID - is UUID of the last document version
        written as ... /uuid[0:2]/uuid[2:4]/uuid/ ...

        Returns absolute path to the thumbnail image as
        instance of ``pathlib.Path``
        """
        last_version = self.versions.last()
        first_page = last_version.pages.first()
        abs_thumbnail_path = rel2abs(
            thumbnail_path(first_page.id, size=size)
        )
        pdf_path = last_version.file_path

        image_utils.generate_preview(
            pdf_path=Path(abs_path(pdf_path)),
            output_folder=abs_thumbnail_path.parent,
            size=size
        )

        return abs_thumbnail_path

    @property
    def name(self):
        root, ext = os.path.splitext(self.file_name)
        return root

    def add_tags(self, tags):
        """
        tags is an iterable of papermerge.core.models.Tag instances
        """
        for tag in tags:
            self.tags.add(
                tag,
                tag_kwargs={'user': self.user}
            )

    def get_ocr_status(self):
        """
        Returns OCR status of the document.

        Document model knows only limited information about
        document OCR status. From point of view of the document
        OCR status can be one of following:

            * succeeded - when document.text field is non empty
            * unknown - when document.text is empty

        In case of "unknown" OCR status application will need to query
        different parts of the system to figure out more details
        about OCR status.
        """
        if len(self.text) > 0:
            return utils.OCR_STATUS_SUCCEEDED

        return utils.OCR_STATUS_UNKNOWN
