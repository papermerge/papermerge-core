from django.db import models
from django.utils.translation import ugettext_lazy as _
from papermerge.core.storage import default_storage

from papermerge.core.lib.path import DocumentPath


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
