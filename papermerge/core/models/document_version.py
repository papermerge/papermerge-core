import logging

from django.db import models
from django.utils.translation import gettext_lazy as _
from papermerge.core.storage import default_storage

from papermerge.core.lib.path import DocumentPath


logger = logging.getLogger(__name__)


class DocumentVersion(models.Model):

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
        default=1,
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

    def abs_file_path(self):
        return default_storage.abspath(
            self.file_path().url()
        )

    def file_path(self):
        doc = self.document

        return DocumentPath(
            user_id=doc.user.pk,
            document_id=doc.pk,
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

    def update_text_field(self, streams):
        """Update document versions's text field from IO streams.

        Arguments:
            ``streams`` - a list of IO text streams

        It will update text field of all associated pages first
        and then concatinate all text field into doc.text field.

        Returns True if document contains non empty non whitespace
        text (i.e it was OCRed)
        """
        text = ""
        stripped_text = ""

        for page, stream in zip(self.pages.all(), streams):
            if len(page.text) == 0:
                text = page.update_text_field(stream)
            text = text + ' ' + page.text

        stripped_text = text.strip()
        if stripped_text:
            self.text = stripped_text
            self.save()

        return len(text.strip()) != 0
