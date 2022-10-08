import uuid

from django.contrib.auth.models import AbstractUser, Permission
from django.db import models

from papermerge.core.models.document import Document
from papermerge.core.models.folder import Folder
from papermerge.core.models.node import BaseTreeNode, AbstractNode
from papermerge.core.models.page import Page
from papermerge.core.models.tags import (
    ColoredTag,
    Tag
)

from papermerge.core.models.document_version import DocumentVersion


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # Initially user is created with empty `home_folder` and `inbox_folder`.
    # Home and Inbox folder fields are populated as part of `post_save` model
    # `user` signal
    home_folder = models.OneToOneField(
        'Folder',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='home_folder_of'
    )
    inbox_folder = models.OneToOneField(
        'Folder',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='inbox_folder_of'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def create_special_folders(self):
        """
        Creates user's home and inbox folders.

        This method is invoked in user's post save
        signal on model creation.
        """
        _inbox, _ = Folder.objects.get_or_create(
            title=Folder.INBOX_TITLE,
            parent=None,
            user=self
        )
        _home, _ = Folder.objects.get_or_create(
            title=Folder.HOME_TITLE,
            parent=None,
            user=self
        )
        self.inbox_folder = _inbox
        self.home_folder = _home
        self.save()

    @property
    def perm_codenames(self):
        """
        Returns aggregated list of permissions codenames of the user.

        Permissions are aggregated from self.user_permissions +
        permissions from all self.groups.
        In Django permissions can be assigned directly to user object
        or via groups. This attribute returns list of string codenames
        of all permissions - from user object and from each associated
        group. It is meant to be passed (and used by) the frontend
        in order to toggle on/off different parts depending on what
        user is allowed/not allowed to view/perform.

        Note that codename DOES NOT include app label.
        """

        # 1. gather all perms via associated groups
        user_groups_field = self._meta.get_field('groups')
        user_groups_query = 'group__%s' % user_groups_field.related_query_name()
        result1 = Permission.objects.filter(
            **{user_groups_query: self}
        ).values_list(
            'codename',
            flat=True
        )
        # 2. gather all perms via user obj
        result2 = self.user_permissions.values_list(
            'codename',
            flat=True
        )

        # combine 1. and 2.
        result = list(result1) + list(result2)

        # remove all duplicates
        return list(set(result))

    def delete(self, using=None, keep_parents=False):
        Document.objects.filter(user=self).delete()
        super().delete(using=using, keep_parents=keep_parents)
