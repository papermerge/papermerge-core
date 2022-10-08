from django.db import models
from django.utils.translation import gettext_lazy as _

from polymorphic_tree.managers import (
    PolymorphicMPTTModelManager,
    PolymorphicMPTTQuerySet
)

from papermerge.core.models.node import (
    BaseTreeNode,
    RELATED_NAME_FMT,
    RELATED_QUERY_NAME_FMT
)


class FolderManager(PolymorphicMPTTModelManager):
    pass


class FolderQuerySet(PolymorphicMPTTQuerySet):

    def delete(self, *args, **kwargs):
        for node in self:
            descendants = node.get_descendants()

            if descendants.count() > 0:
                descendants.delete(*args, **kwargs)
            # At this point all descendants were deleted.
            # Self delete :)
            try:
                node.delete(*args, **kwargs)
            except BaseTreeNode.DoesNotExist:
                # this node was deleted by earlier recursive call
                # it is ok, just skip
                pass


CustomFolderManager = FolderManager.from_queryset(FolderQuerySet)


class Folder(BaseTreeNode):

    # Each user has two special folders: Inbox and Home. Each of this folders
    # is created when respective user model is created.
    # Inbox is where all incoming documents are placed (i.e. from IMAP client).
    # Home is topmost folder from his/her stand point i.e. 'landing page'
    # when he/she lands in web UI. Everything outside user's home and
    # inbox folders is not visible/accessible to him/her.
    # Both Inbox and Home are user's topmost folders i.e.
    # is_parent = null and user_id = <current_user_id>

    # Special folders' name always starts with a DOT ('.') character
    INBOX_TITLE = ".inbox"
    HOME_TITLE = ".home"

    objects = CustomFolderManager()

    class JSONAPIMeta:
        resource_name = "folders"

    def delete(self, *args, **kwargs):
        descendants = self.basetreenode_ptr.get_descendants()

        if descendants.count() > 0:
            for node in descendants:
                try:
                    node.delete(*args, **kwargs)
                except BaseTreeNode.DoesNotExist:
                    pass
        # At this point all descendants were deleted.
        # Self delete :)
        try:
            super().delete(*args, **kwargs)
        except BaseTreeNode.DoesNotExist:
            # this node was deleted by earlier recursive call
            # it is ok, just skip
            pass

    class Meta:
        verbose_name = _("Folder")
        verbose_name_plural = _("Folders")

    def __str__(self):
        return self.title


class AbstractFolder(models.Model):
    base_ptr = models.ForeignKey(
        Folder,
        related_name=RELATED_NAME_FMT,
        related_query_name=RELATED_QUERY_NAME_FMT,
        on_delete=models.CASCADE
    )

    class Meta:
        abstract = True

    def get_title(self):
        return self.base_ptr.title


def get_inbox_children(user):
    """
    Returns a ``QuerySet`` containing the immediate children nodes
    of given user's inbox folder
    """
    inbox_node = BaseTreeNode.objects.get(
        title=Folder.INBOX_TITLE,
        user=user
    )

    return inbox_node.get_children()
