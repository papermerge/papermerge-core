import io
import logging
import os
import uuid
from pathlib import Path

from django.db import models

from papermerge.core import constants as const
from papermerge.core.pathlib import (abs_page_hocr_path, abs_page_jpg_path,
                                     abs_page_svg_path, abs_page_txt_path,
                                     abs_thumbnail_path)
from papermerge.core.storage import abs_path
from papermerge.core.utils import clock
from papermerge.core.utils import image as image_utils

from .utils import OCR_STATUS_SUCCEEDED, OCR_STATUS_UNKNOWN

logger = logging.getLogger(__name__)


class Page(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    document_version = models.ForeignKey(
        to='DocumentVersion',
        on_delete=models.CASCADE,
        related_name='pages'
    )

    number = models.IntegerField(default=1)
    page_count = models.IntegerField(default=1)

    text = models.TextField(default='')

    # inherited/normalized title from parent document
    norm_doc_title = models.CharField(
        max_length=200,
        default=''
    )

    # inherited/normalized title of immediate parent folder
    norm_folder_title = models.CharField(
        max_length=200,
        default=''
    )

    # normalized space delimited path (by folder title) of parent folder
    norm_breadcrump = models.CharField(
        max_length=1024,
        default=''
    )

    # text from all pages of the document
    norm_text = models.TextField(default='')

    # hm, this one should be norm_lang as well
    lang = models.CharField(
        max_length=8,
        blank=False,
        null=False,
        default='deu'
    )

    image = models.CharField(
        max_length=1024,
        default=''
    )

    class Meta:
        # Guarantees that
        # doc.pages.all() will return pages ordered by number.
        # test by
        # test_page.TestPage.test_pages_all_returns_pages_ordered
        ordering = ['number']

    def __str__(self):
        return f"id={self.pk} number={self.number}"

    @property
    def is_archived(self):
        """
        Returns True of page is archived.

        Page is considered archived if it belongs to archived document version.
        In other words, page is considered archived it is part of non-last
        document version.
        """
        return self.document_version.is_archived

    @property
    def is_last(self):
        return self.number == self.page_count

    @property
    def is_first(self):
        return self.number == 1

    def generate_thumbnail(
        self,
        size: int = const.DEFAULT_THUMBNAIL_SIZE
    ) -> Path:
        """Generates page thumbnail/preview image for the document

        The local path to the generated thumbnail will be
        /<MEDIA_ROOT>/pages/jpg/<splitted page uuid>/<size>.jpg

        Returns absolute path to the thumbnail image as
        instance of ``pathlib.Path``
        """
        thb_path = abs_thumbnail_path(str(self.id), size=size)

        pdf_path = self.document_version.file_path  # noqa

        image_utils.generate_preview(
            pdf_path=Path(pdf_path),
            page_number=int(self.number),
            output_folder=thb_path.parent,
            size=size
        )

        return thb_path

    @property
    def has_text(self):
        return len(self.stripped_text) != 0

    @property
    def stripped_text(self):
        return self.text.strip()

    def update_text_field(self, stream: io.StringIO):
        """Update text field from given IO stream.

        Returns text read from IO stream
        """
        self.text = stream.read()
        self.save()

        return self.stripped_text

    @property
    def txt_path(self) -> Path:
        return abs_page_txt_path(str(self.id))

    @property
    def svg_path(self) -> Path:
        return abs_page_svg_path(str(self.id))

    @property
    def jpg_path(self) -> Path:
        return abs_page_jpg_path(str(self.id))

    @property
    def hocr_path(self) -> Path:
        return abs_page_hocr_path(str(self.id))

    @property
    def txt_exists(self):
        return self.txt_path.exists()

    def norm(self):
        """shortcut normalization method"""
        self.normalize_doc_title()
        self.normalize_folder_title()
        self.normalize_breadcrump()
        self.normalize_text()
        self.normalize_lang()

    def normalize_doc_title(self):
        """
        Save containing document's title
        """
        self.norm_doc_title = self.document.title
        self.save()

    def normalize_folder_title(self):
        """
        Save direct parent folder (containing folder) title
        """
        if self.document.parent:
            self.norm_folder_title = self.document.parent.title
            self.save()

    def normalize_breadcrump(self):
        pass

    def normalize_text(self):
        pass

    def normalize_lang(self):
        pass

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

    @clock
    def get_jpeg(self):
        jpeg_abs_path = abs_path(self.page_path.preview_url)

        if not os.path.exists(jpeg_abs_path):
            # generate preview only for this page
            self.document_version.generate_previews(
                page_number=self.number
            )

        if not os.path.exists(jpeg_abs_path):
            # means that self.generate_preview() failed
            # to extract page image from the document
            raise IOError

        with open(jpeg_abs_path, "rb") as f:
            data = f.read()

        return data

    @clock
    def get_svg(self):
        svg_abs_path = abs_path(
            self.page_path.svg_url
        )

        if not os.path.exists(svg_abs_path):
            raise IOError

        with open(svg_abs_path, "rb") as f:
            data = f.read()

        return data


def get_pages(
    nodes,
    include_pages_with_empty_text=True
):
    """
    :nodes: is a query set of BaseTreeNodes

    Returns a QuerySet of Page(s)
    """
    if nodes.count() == 0:
        return Page.objects.none()

    pages = Page.objects.filter(
        document__in=nodes
    )

    if not include_pages_with_empty_text:
        ret_pages = pages.exclude(
            text__isnull=True
        ).exclude(
            text__exact=''
        )
    else:
        ret_pages = pages

    return ret_pages
