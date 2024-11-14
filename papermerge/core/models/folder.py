from typing import List

from celery import current_app
from django.db import models

from papermerge.core import constants as const
from papermerge.core.models import utils
from papermerge.core.models.node import BaseTreeNode
from papermerge.core.utils.decorators import if_redis_present


class FolderManager(models.Manager):
    pass


class FolderQuerySet(models.QuerySet):

    def delete(self, *args, **kwargs):
        deleted_node_ids = []
        for node in self:
            descendants = node.get_descendants()

            if len(descendants) > 0:
                deleted_node_ids.append(str(node.pk))
                descendants.delete(*args, **kwargs)
            # At this point all descendants were deleted.
            # Self delete :)
            try:
                deleted_node_ids.append(str(self.pk))
                node.delete(*args, **kwargs)
            except BaseTreeNode.DoesNotExist:
                # this node was deleted by earlier recursive call
                # it is ok, just skip
                pass

            self.publish_post_delete_task(deleted_node_ids)

    @if_redis_present
    def publish_post_delete_task(self, node_ids: List[str]):
        current_app.send_task(
            const.INDEX_REMOVE_NODE, kwargs={"item_ids": node_ids}, route_name="i3"
        )

    def get_by_breadcrumb(
        self, breadcrumb: str, user  # should this be pathlib.PurePath ?
    ) -> "Folder":
        """
        Returns ``Folder`` instance of the node defined by given
        breadcrumb path of specific ``User``.

        Example of usage:

        folder = Folder.objects.get_by_breadcrumb('.home/My Documents', user)
        assert folder.title == 'My Documents'
        """
        return utils.get_by_breadcrumb(Folder, breadcrumb, user)


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

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.publish_post_save_task()

    @if_redis_present  # skip this method when running tests
    def publish_post_save_task(self):
        """Send task to worker to add folder changes to search index

        This method WILL NOT be invoked during tests
        """
        id_as_str = str(self.pk)
        current_app.send_task(
            const.INDEX_ADD_NODE, kwargs={"node_id": id_as_str}, route_name="i3"
        )

    class Meta:
        verbose_name = "Folder"
        verbose_name_plural = "Folders"

    def __str__(self):
        return self.title

    def get_children(self):
        """Returns direct children of current node"""
        return Folder.objects.filter(parent=self)


def get_inbox_children(user):
    """
    Returns a ``QuerySet`` containing the immediate children nodes
    of given user's inbox folder
    """
    inbox_node = BaseTreeNode.objects.get(title=Folder.INBOX_TITLE, user=user)

    return inbox_node.get_children()
