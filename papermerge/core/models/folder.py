from pathlib import PurePath

from django.db import models

from papermerge.core.models.node import BaseTreeNode


class FolderManager(models.Manager):
    pass


class FolderQuerySet(models.QuerySet):

    def delete(self, *args, **kwargs):
        for node in self:
            descendants = node.get_descendants()

            if len(descendants) > 0:
                descendants.delete(*args, **kwargs)
            # At this point all descendants were deleted.
            # Self delete :)
            try:
                node.delete(*args, **kwargs)
            except BaseTreeNode.DoesNotExist:
                # this node was deleted by earlier recursive call
                # it is ok, just skip
                pass

    def get_by_breadcrumb(self, breadcrumb: str):
        """
        Returns node instance identified by breadcrumb

        This method uses SQL which is not portable: '||' is concatenates
        strings ONLY in SQLite and PostgreSQL.
        """
        first_part = PurePath(breadcrumb).parts[0]
        pure_breadcrumb = str(PurePath(breadcrumb))  # strips '/' at the end
        sql = '''
         WITH RECURSIVE tree AS (
             SELECT *, title as breadcrumb
             FROM core_basetreenode WHERE title = %s
             UNION ALL
             SELECT core_basetreenode.*,
                (breadcrumb || '/'  || core_basetreenode.title) as breadcrumb
             FROM core_basetreenode, tree
             WHERE core_basetreenode.parent_id = tree.id
         )
         '''
        sql += 'SELECT id, title FROM tree WHERE breadcrumb = %s LIMIT 1'

        result_list = list(BaseTreeNode.objects.raw(
            sql, [first_part, pure_breadcrumb]
        ))

        if len(result_list) == 0:
            raise Folder.DoesNotExist()

        if len(result_list) > 1:
            raise Folder.MultipleObjectsReturned()

        return result_list[0].folder


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

        if len(descendants) > 0:
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

    @property
    def breadcrumb(self) -> str:
        value = super().breadcrumb
        return value + '/'

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
    inbox_node = BaseTreeNode.objects.get(
        title=Folder.INBOX_TITLE,
        user=user
    )

    return inbox_node.get_children()
