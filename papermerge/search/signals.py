import logging
from django.db import models

from haystack import signals
from haystack.utils import get_identifier

from papermerge.core.models import (
    DocumentVersion,
    Document,
    Folder,
    BaseTreeNode
)
from papermerge.core.signal_definitions import node_post_move
from papermerge.search.tasks import update_index


logger = logging.getLogger(__name__)


class SignalProcessor(signals.BaseSignalProcessor):
    def setup(self):
        for klass in (DocumentVersion, Document, Folder, BaseTreeNode):
            models.signals.post_save.connect(
                self.enqueue_save, sender=klass
            )
            models.signals.post_delete.connect(
                self.enqueue_delete, sender=klass
            )

        node_post_move.connect(
            self.after_node_moved, sender=BaseTreeNode
        )

    def teardown(self):
        for klass in (DocumentVersion, Document, Folder, BaseTreeNode):
            models.signals.post_save.disconnect(self.enqueue_save, sender=klass)
            models.signals.post_delete.disconnect(
                self.enqueue_delete,
                sender=klass
            )
        node_post_move.disconnect(
            self.after_node_moved
        )

    def after_node_moved(self, instance, new_parent, **kwargs):
        """
        After node was moved to the new parent, we need to update all
        descendants of the new parent so that they will have correct breadcrumb.
        An example will help:

        - Inbox
            - bibliothek
                - some_doc_1.pdf (contains word 'books')
                - some_doc_2.pdf (contains word 'books')
        - Home
            - My documents

        If user now searches for word 'books', search engine will return
        two entries:

            some_doc_1.pdf with breadcrumb .index > bibliothek > some_doc_1.pdf
            some_doc_2.pdf with breadcrumb .index > bibliothek > some_doc_2.pdf

        However, if user moves both some_doc_1.pdf and some_doc_2.pdf to
        Home > My documents, then breadcrumb of the some_doc_1.pdf and
        some_doc_2.pdf changes as well. If we don't update index, then
        search results for word 'books' will return correctly the documents
        but the breadcrumbs will be as if the documents are still in Inbox.
        In other words, if we don't update the index, after the move, searching
        for word 'books' will reveal following entries:

            some_doc_1.pdf with breadcrumb .index > bibliothek > some_doc_1.pdf
            some_doc_2.pdf with breadcrumb .index > bibliothek > some_doc_2.pdf

        The results are correct, but their breadcrumb is wrong (outdated).

        In order to solve above described problem, we need to update index
        (which in turn will update breadcrumbs) of all descendant nodes
        of the new parent - which include newly moved nodes as well.
        """
        for node in new_parent.get_descendants():  # includes newly moved nodes
            self.enqueue('save', node, **kwargs)

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
        elif 'basetreenode' in identifier:   # i.e. is this core.BaseTreeNode ?
            try:
                identifier = get_identifier(instance.document_or_folder)
            except Document.DoesNotExist:
                # this scenario occurs because associated folder
                # was deleted before
                logger.debug(
                    f"{instance} does not have associated document"
                )
                # don't continue with index update
                return
            except Folder.DoesNotExist:
                # this scenario occurs because associated folder
                # was deleted before
                logger.debug(
                    f"{instance} does have associated folder"
                )
                # don't continue with index update
                return

        logger.debug(
            "Update index action={}, identifier={}".format(
                action,
                identifier
            )
        )
        update_index.apply_async(kwargs={
            'action': action,
            'identifier': identifier
        })
