import os
import uuid
import logging

from django.db import models
from django.utils.translation import gettext_lazy as _
from papermerge.core.storage import abs_path

from pdf2image import convert_from_path
from pdf2image.generators import counter_generator

from papermerge.core.lib.path import DocumentPath


logger = logging.getLogger(__name__)


class DocumentVersion(models.Model):
    """Document Version

    Document can have one or multiple versions.
    Document has at least one version associated (the original).
    Each document version has a number - which starts with 1 (one) i.e.
    original document version is - document version 1 (one).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    document = models.ForeignKey(
        to='Document',
        on_delete=models.CASCADE,
        related_name='versions',
        verbose_name=_('Document')
    )

    lang = models.CharField(
        _('Language'),
        max_length=8,
        blank=False,
        null=False,
        default='deu'
    )
    # version number
    number = models.IntegerField(
        default=1,  # Document versioning starts with 1
        verbose_name=_('Version number')
    )
    #: basename + ext of uploaded file.
    #: other path details are deducted from user_id and document_id
    file_name = models.CharField(
        max_length=1024,
        blank=True,
        null=True,
    )
    size = models.BigIntegerField(
        help_text="Size of file_orig attached. Size is in Bytes",
        blank=False,
        null=False,
        default=0
    )
    page_count = models.IntegerField(
        blank=False,
        default=0
    )
    short_description = models.CharField(
        max_length=128,
        blank=True,
        default=''
    )

    text = models.TextField(blank=True)

    class Meta:
        ordering = ('number',)
        verbose_name = _('Document version')
        verbose_name_plural = _('Document versions')

    def __repr__(self):
        return f"DocumentVersion(id={self.pk}, number={self.number})"

    def abs_file_path(self):
        return abs_path(
            self.document_path.url
        )

    def generate_previews(self, page_number=None):
        logger.debug('generate_previews BEGIN')
        abs_dirname = abs_path(self.document_path.dirname_sidecars())

        kwargs = {
            'pdf_path': abs_path(self.document_path.url),
            'output_folder':  abs_dirname,
            'fmt': 'jpg',
            'size': (900,),
            'output_file': counter_generator(padding_goal=3)
        }

        # in case page_number not None - generate only specific
        # page number's preview
        if page_number:
            kwargs['first_page'] = page_number
            kwargs['last_page'] = page_number

        os.makedirs(
            abs_dirname,
            exist_ok=True
        )
        # generates jpeg previews of PDF file using pdftoppm (poppler-utils)
        convert_from_path(**kwargs)
        logger.debug('generate_previews END')

    @property
    def is_archived(self):
        """
        Returns True if document version is archived.

        Document version is considered archived if
        it is non-last version of the document.
        Only last document version is editable, or to put
        in other words - archived document versions are not
        editable.
        """
        return self != self.document.versions.last()

    @property
    def document_path(self):
        return DocumentPath(
            user_id=self.document.user.pk,
            document_id=self.document.pk,
            version=self.number,
            file_name=self.file_name,
        )

    def create_pages(self, page_count=None):
        """
        Creates Page models for current document version.

        If no argument is supplied, will read
        number of pages from `self.page_count`
        """

        new_page_count = self.page_count  # may be zero

        if page_count:
            # provided non empty argument overrides `self.page_count`
            new_page_count = page_count

        if not new_page_count:
            # Number of pages in document version is 0 or None
            # Also no argument was supplied. Nothing to do.
            return

        for page_number in range(1, new_page_count + 1):
            self.pages.create(
                number=page_number,
                page_count=new_page_count,
                lang=self.lang
            )

        if new_page_count and new_page_count != self.page_count:
            self.page_count = new_page_count
            self.save()

    @property
    def has_combined_text(self):
        """
        Returns ``True`` if at least one of document versions'
        page contains non empty, non whitespace text - otherwise
        returns ``False``
        """
        text = ''

        for page in self.pages.all():
            text = text + ' ' + page.text

        return len(text.strip()) != 0

    def update_text_field(self, streams):
        """Update document versions's text field from IO streams.

        Arguments:
            ``streams`` - a list of IO text streams

        It will update text field of all associated pages first
        and then concatinate all text field into doc.text field.

        Returns True if document version contains non empty non whitespace
        text (i.e it was OCRed)
        """
        text = []

        logger.debug(
            'document.update_text_field: '
            f'document_id={self.pk} streams_count={len(streams)}'
        )

        for page, stream in zip(self.pages.all(), streams):
            if len(page.text) == 0:
                page.update_text_field(stream)
                text.append(page.stripped_text)

        stripped_text = ' '.join(text)
        stripped_text = stripped_text.strip()
        if stripped_text:
            self.text = stripped_text
            self.save()

        return self.has_combined_text

    def get_ocred_text(
        self,
        page_numbers: list = (),
        page_ids: list = ()
    ) -> str:
        """
        Returns OCRed text of given pages.

        You can filter pages for which OCRed is requested either be page numbers
        or by page_ids.
        If both page_numbers and page_ids are empty i.e. no filters, then
        return `self.text`.
        """
        pages_text = " ".join([
            page.text for page in self.pages.all()
            if page.number in page_numbers or str(page.pk) in page_ids
        ])

        if page_ids or page_numbers:
            result = pages_text.strip()
        else:
            # when both filters are empty, return the `self.text` field
            result = self.text.strip()

        return result
