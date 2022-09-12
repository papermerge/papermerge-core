from django.db import models
from haystack import signals
from haystack.utils import get_identifier

from papermerge.core.models import DocumentVersion, Document, Folder
from papermerge.search.tasks import update_index


class SignalProcessor(signals.BaseSignalProcessor):
    def setup(self):
        for klass in (DocumentVersion, Document, Folder):
            models.signals.post_save.connect(
                self.enqueue_save, sender=klass
            )
            models.signals.post_delete.connect(
                self.enqueue_delete, sender=klass
            )

    def teardown(self):
        for klass in (DocumentVersion, Document, Folder):
            models.signals.post_save.disconnect(self.enqueue_save, sender=klass)
            models.signals.post_delete.disconnect(
                self.enqueue_delete,
                sender=klass
            )

    def enqueue_save(self, sender, instance, **kwargs):
        return self.enqueue('save', instance, **kwargs)

    def enqueue_delete(self, sender, instance, **kwargs):
        return self.enqueue('delete', instance, **kwargs)

    def enqueue(self, action, instance, **kwargs):
        identifier = get_identifier(instance)

        # We index only Document and Folder models, however when
        # new DocumentVersion is saved/deleted we need to update its
        # associated Document
        if isinstance(instance, DocumentVersion):
            identifier = get_identifier(instance.document)

        update_index.apply_async(kwargs={
            'action': action,
            'identifier': identifier
        })
