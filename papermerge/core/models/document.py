import io
import logging
import os
from os.path import getsize
from pathlib import Path

from django.db import models, transaction
from pikepdf import Pdf

from papermerge.core import constants as const
from papermerge.core.features.document_types.models import DocumentType
from papermerge.core.lib.path import DocumentPath, PagePath
from papermerge.core.models import utils
from papermerge.core.pathlib import (
    abs_thumbnail_path,
    rel2abs,
    thumbnail_path,
)
from papermerge.core.storage import abs_path
from papermerge.core.utils import image as image_utils

from .document_version import DocumentVersion
from .node import BaseTreeNode
from papermerge.core.constants import ContentType

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
            document=doc, number=doc.versions.count() + 1, lang=doc.lang
        )

    document_version.file_name = file_name
    document_version.size = file_size
    document_version.page_count = 0
    if short_description:
        document_version.short_description = short_description

    document_version.save()

    return document_version


def file_type(content_type: ContentType) -> FileType:
    parts = content_type.split("/")
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
        **kwargs,
    ):
        attrs = dict(title=title, lang=lang, parent=parent, **kwargs)
        if id is not None:
            attrs["id"] = id

        doc = Document(**attrs)
        doc.save()

        document_version = DocumentVersion(
            document=doc,
            number=1,  # versioning number starts with 1
            file_name=file_name,
            size=0,
            page_count=0,
            lang=lang,
            short_description="Original",
        )
        document_version.save()
        return doc

    def _get_parent(self, parent_id):
        """
        Returns parent node instance based on ``parent_id``
        """
        parent = None

        if parent_id is None or parent_id == "":
            parent = None
        else:
            try:
                parent = BaseTreeNode.objects.get(id=parent_id)
            except BaseTreeNode.DoesNotExist:
                parent = None

        return parent


class DocumentQuerySet(models.QuerySet):
    def get_by_breadcrumb(self, breadcrumb: str, user):
        return utils.get_by_breadcrumb(Document, breadcrumb, user)


CustomDocumentManager = DocumentManager.from_queryset(DocumentQuerySet)


class Document(BaseTreeNode):
    # Will this document be OCRed?
    # If True this document will be OCRed
    # If False, OCR operation will be skipped for this document
    ocr = models.BooleanField(default=True)
    ocr_status = models.CharField(
        choices=utils.OCR_STATUS_CHOICES,
        default=utils.OCR_STATUS_UNKNOWN,
        max_length=32,
    )

    document_type = models.ForeignKey(
        DocumentType,
        related_name="documents",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        default=None,
    )

    objects = CustomDocumentManager()

    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"

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
        source_pdf = Pdf.open(first_page.document_version.file_path)
        dst_pdf = Pdf.new()

        document_version = self.versions.filter(size=0).last()

        if not document_version:
            document_version = DocumentVersion(
                document=self, number=self.versions.count(), lang=self.lang
            )

        for page in pages:
            pdf_page = source_pdf.pages.p(page.number)
            dst_pdf.pages.append(pdf_page)

        document_version.file_name = first_page.document_version.file_name
        document_version.page_count = page_count
        document_version.save()

        dirname = os.path.dirname(document_version.file_path)
        os.makedirs(dirname, exist_ok=True)

        dst_pdf.save(document_version.file_path)

        document_version.size = getsize(document_version.file_path)
        document_version.save()

        document_version.create_pages()
        source_pdf.close()
        dst_pdf.close()

        return document_version

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
        return abs_path(self.path().url())

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
                page_count=self.get_pagecount(version=version),
            )
            results.append(page_path)

        return results

    def get_page_path(self, page_num, version=None):
        return PagePath(
            document_path=self.path(version=version),
            page_num=page_num,
            page_count=self.page_count,
        )

    def generate_thumbnail(self, size: int = const.DEFAULT_THUMBNAIL_SIZE) -> Path:
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
        abs_thumbnail_path = rel2abs(thumbnail_path(first_page.id, size=size))
        pdf_path = last_version.file_path

        image_utils.generate_preview(
            pdf_path=Path(abs_path(pdf_path)),
            output_folder=abs_thumbnail_path.parent,
            size=size,
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
            self.tags.add(tag, tag_kwargs={"user": self.user})

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
