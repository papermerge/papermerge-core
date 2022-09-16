import logging
import os
import uuid

from django.db import models
from pikepdf import Pdf, PdfImage

from papermerge.core.lib.path import PagePath
from papermerge.core.storage import abs_path
from papermerge.core.utils import clock

from .diff import Diff
from .kvstore import KVCompPage, KVPage, KVStorePage
from .utils import (
    OCR_STATUS_SUCCEEDED,
    OCR_STATUS_UNKNOWN
)

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
    def kv(self):
        return KVPage(instance=self)

    @property
    def kvcomp(self):
        return KVCompPage(instance=self)

    def _apply_diff_add(self, diff):

        self.kv.apply_additions(
            [
                {
                    'kv_inherited': True,
                    'key': _model.key,
                    'kv_format': _model.kv_format,
                    'kv_type': _model.kv_type
                }
                for _model in diff
            ]
        )

    def _apply_diff_update(self, diff, attr_updates):
        updates = [{
            'kv_inherited': True,
            'key': _model.key,
            'kv_format': _model.kv_format,
            'kv_type': _model.kv_type,
            'id': _model.id
        } for _model in diff]

        updates.extend(attr_updates)

        self.kv.apply_updates(updates)

    def _apply_diff_delete(self, diff):
        pass

    def apply_diff(self, diffs_list, attr_updates):

        for diff in diffs_list:
            if diff.is_add():
                self._apply_diff_add(diff)
            elif diff.is_update():
                self._apply_diff_update(diff, attr_updates)
            elif diff.is_delete():
                self._apply_diff_delete(diff)
            elif diff.is_replace():
                # not applicable to page model
                # replace is used in access permissions
                # propagation
                pass
            else:
                raise ValueError(
                    f"Unexpected diff {diff} type"
                )

    def inherit_kv_from(self, document):
        instances_set = []

        for kvstore in document.kv.all():
            instances_set.append(
                KVStorePage(
                    key=kvstore.key,
                    kv_format=kvstore.kv_format,
                    kv_type=kvstore.kv_type,
                    value=kvstore.value,
                    kv_inherited=True,
                    page=self
                )
            )

        diff = Diff(
            operation=Diff.ADD,
            instances_set=instances_set
        )

        self.propagate_changes(
            diffs_set=[diff],
        )

    def propagate_changes(
        self,
        diffs_set,
        apply_to_self=None,
        attr_updates=[]
    ):
        """
        apply_to_self argument does not make sense here.
        apply_to_self argument is here to make this function
        similar to node.propagate_changes.
        """
        self.apply_diff(
            diffs_list=diffs_set,
            attr_updates=attr_updates
        )

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

    @property
    def page_path(self):

        return PagePath(
            document_path=self.document_version.document_path,
            page_num=self.number,
        )

    @property
    def has_text(self):
        return len(self.stripped_text) != 0

    @property
    def stripped_text(self):
        return self.text.strip()

    def update_text_field(self, stream):
        """Update text field from given IO stream.

        Returns text read from IO stream
        """
        logger.debug(
            'update_text_field:'
            f'len(page.stripped_text)=={len(self.stripped_text)}'
        )
        self.text = stream.read()
        self.save()

        return self.stripped_text

    @property
    def txt_url(self):
        result = PagePath(
            document_path=self.document_version.document_path,
            page_num=self.number
        )

        return result.txt_url

    @property
    def txt_exists(self):

        result = PagePath(
            document_path=self.document.document_path,
            page_num=self.number
        )

        return result.txt_exists()

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
    def generate_img(self):
        doc_file_path = self.document_version.document_path
        # extract page number preview from the document file
        # if this is PDF - use pike pdf to extract that preview
        pdffile = Pdf.open(abs_path(doc_file_path.url))
        page = pdffile.pages[self.number - 1]
        image_keys = list(page.images.keys())
        raw_image = page.images[image_keys[0]]
        pdfimage = PdfImage(raw_image)
        abs_file_prefix = abs_path(self.page_path.ppmroot)
        abs_dirname_prefix = os.path.dirname(abs_file_prefix)
        os.makedirs(
            abs_dirname_prefix,
            exist_ok=True
        )
        pil_image = pdfimage.as_pil_image()
        page_rotation = 0
        if '/Rotate' in page:
            page_rotation = page['/Rotate']
        if page_rotation > 0:
            # The image is not rotated in place. You need to store the image
            # returned from rotate()
            new_pil_image = pil_image.rotate(page_rotation)
            new_pil_image.save(f"{abs_file_prefix}.jpg")
            return
        # Will create jpg image without '_ocr' suffix
        return pdfimage.extract_to(fileprefix=abs_file_prefix)

    @clock
    def get_jpeg(self):
        jpeg_abs_path = abs_path(self.page_path.jpg_url)
        if not os.path.exists(jpeg_abs_path):
            self.generate_img()

        if not os.path.exists(jpeg_abs_path):
            # means that self.generate_img() failed
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
