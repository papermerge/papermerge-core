import logging
import os
from typing import Optional
from os.path import getsize
from pikepdf import Pdf

from django.db import models
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from polymorphic_tree.managers import (
    PolymorphicMPTTModelManager,
    PolymorphicMPTTQuerySet
)

from papermerge.core.lib.path import DocumentPath, PagePath
from papermerge.core.signal_definitions import document_post_upload
from papermerge.core.storage import get_storage_instance, abs_path

from .node import BaseTreeNode
from .utils import (
    OCR_STATUS_SUCCEEDED,
    OCR_STATUS_UNKNOWN,
    OCR_STATUS_CHOICES
)
from .page import Page
from .document_version import DocumentVersion


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


class DocumentManager(PolymorphicMPTTModelManager):

    @transaction.atomic
    def create_document(
        self,
        user_id,
        title,
        lang,
        size=0,
        page_count=0,
        file_name=None,
        parent=None,
        **kwargs
    ):
        doc = Document(
            title=title,
            lang=lang,
            user_id=user_id,
            parent=parent,
            **kwargs
        )
        doc.save()

        document_version = DocumentVersion(
            document=doc,
            number=1,  # versioning number starts with 1
            file_name=file_name,
            size=0,
            page_count=0,
            short_description=_("Original")
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


class DocumentQuerySet(PolymorphicMPTTQuerySet):
    pass


CustomDocumentManager = DocumentManager.from_queryset(DocumentQuerySet)


class Document(BaseTreeNode):

    # Will this document be OCRed?
    # If True this document will be OCRed
    # If False, OCR operation will be skipped for this document
    ocr = models.BooleanField(default=True)

    # This field is updated by
    # `papermerge.avenues.consumers.document.DocumentConsumer`.
    #
    # Can be one of: 'unknown', 'received', 'started',
    # 'failed', 'succeeded' - these values correspond to
    # celery's task statuses
    ocr_status = models.CharField(
        choices=OCR_STATUS_CHOICES,
        default=OCR_STATUS_UNKNOWN,
        max_length=32
    )

    objects = CustomDocumentManager()

    @property
    def idified_title(self):
        """
        Returns a title with ID part inserted before extention

        Example:
            input: title="invoice.pdf", id="233453"
            output: invoice-233453.pdf
        """
        base_title_arr = self.title.split('.')[:-1]
        base_title = '.'.join(base_title_arr)
        ext = self.title.split('.')[-1]

        return f'{base_title}-{self.id}.{ext}'

    class Meta:
        verbose_name = _("Document")
        verbose_name_plural = _("Documents")

    def upload(
            self,
            payload,
            file_path,
            file_name,
            strategy=UploadStrategy.INCREMENT
    ):
        """
        Associates payload with specific document version.

        If document has zero sized document version, it will associate
        payload with that (existing) version, otherwise it will create
        new document version and associate it the payload.
        """
        pdf = Pdf.open(payload)

        document_version = self.versions.filter(size=0).last()

        if not document_version:
            document_version = DocumentVersion(
                document=self,
                number=self.versions.count(),
                lang=self.lang
            )

        document_version.file_name = file_name
        document_version.size = getsize(file_path)
        document_version.page_count = len(pdf.pages)

        get_storage_instance().copy_doc(
            src=file_path,
            dst=document_version.document_path
        )

        document_version.save()
        document_version.create_pages()
        pdf.close()

        document_post_upload.send(
            sender=self.__class__,
            document_version=document_version
        )

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
            abs_path(first_page.document_version.document_path.url)
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
            abs_path(document_version.document_path.url)
        )
        os.makedirs(dirname, exist_ok=True)

        dst_pdf.save(abs_path(document_version.document_path.url))

        document_version.size = getsize(
            abs_path(document_version.document_path.url)
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

    def preview_path(self, page, size=None):

        if page > self.page_count or page < 0:
            raise ValueError("Page index out of bound")

        file_name = os.path.basename(self.file_name)
        root, _ = os.path.splitext(file_name)
        page_count = self.pages_num

        if not size:
            size = "orig"

        if page_count <= 9:
            fmt_page = "{root}-page-{num:d}.{ext}"
        elif page_count > 9 and page_count < 100:
            fmt_page = "{root}-page-{num:02d}.{ext}"
        elif page_count > 100:
            fmt_page = "{root}-page-{num:003d}.{ext}"

        return os.path.join(
            self.dir_path,
            str(size),
            fmt_page.format(
                root=root, num=int(page), ext="jpg"
            )
        )

    @property
    def name(self):
        root, ext = os.path.splitext(self.file_name)
        return root

    def add_tags(self, tags):
        """
        tags is an iteratable of papermerge.core.models.Tag instances
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
            return OCR_STATUS_SUCCEEDED

        return OCR_STATUS_UNKNOWN
