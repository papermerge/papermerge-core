from django.db import models
from haystack import signals

from papermerge.core.models import (
    DocumentVersion,
    Document,
    Folder,
    BaseTreeNode
)
from papermerge.search.tasks import update_index


class SignalProcessor(signals.BaseSignalProcessor):
    def setup(self):
        for klass in (DocumentVersion, Document, Folder, BaseTreeNode):
            models.signals.post_save.connect(
                self.enqueue_save, sender=klass
            )
            models.signals.post_delete.connect(
                self.enqueue_delete, sender=klass
            )

    def teardown(self):
        for klass in (DocumentVersion, Document, Folder, BaseTreeNode):
            models.signals.post_save.disconnect(self.enqueue_save, sender=klass)
            models.signals.post_delete.disconnect(
                self.enqueue_delete,
                sender=klass
            )

    def enqueue_save(self, sender, instance, **kwargs):
        return update_index.apply_async()

    def enqueue_delete(self, sender, instance, **kwargs):
        return update_index.apply_async()
