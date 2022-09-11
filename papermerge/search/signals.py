from django.db import models
from haystack import signals

from papermerge.core.models import DocumentVersion, Document, Folder


class SignalProcessor(signals.BaseSignalProcessor):
    def setup(self):
        for klass in (DocumentVersion, Document, Folder):
            models.signals.post_save.connect(self.handle_save, sender=klass)
            models.signals.post_delete.connect(self.handle_delete, sender=klass)

    def teardown(self):
        for klass in (DocumentVersion, Document, Folder):
            models.signals.post_save.disconnect(self.handle_save, sender=klass)
            models.signals.post_delete.disconnect(
                self.handle_delete,
                sender=klass
            )
