import logging
import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

from papermerge.core.features.custom_fields.models import (
    CustomField,
    DocumentTypeCustomField,
)
from papermerge.core.models.document import Document
from papermerge.core.models.document_version import DocumentVersion
from papermerge.core.models.folder import Folder
from papermerge.core.models.node import BaseTreeNode
from papermerge.core.models.page import Page

logger = logging.getLogger(__name__)


__all__ = [
    Document,
    DocumentVersion,
    Page,
    BaseTreeNode,
    Folder,
    CustomField,
    DocumentTypeCustomField,
]


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # Initially user is created with empty `home_folder` and `inbox_folder`.
    # Home and Inbox folder fields are populated as part of `post_save` model
    # `user` signal
    home_folder = models.OneToOneField(
        "Folder",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="home_folder_of",
    )
    inbox_folder = models.OneToOneField(
        "Folder",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="inbox_folder_of",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def create_special_folders(self):
        """
        Creates user's home and inbox folders.

        This method is invoked in user's post save
        signal on model creation.
        """
        _inbox, _ = Folder.objects.get_or_create(
            title=Folder.INBOX_TITLE, parent=None, user=self
        )
        _home, _ = Folder.objects.get_or_create(
            title=Folder.HOME_TITLE, parent=None, user=self
        )
        self.inbox_folder = _inbox
        self.home_folder = _home
        self.save()

    def delete(self, using=None, keep_parents=False):
        Document.objects.filter(user=self).delete()
        super().delete(using=using, keep_parents=keep_parents)

    def delete_user_data(self):
        user_docs = Document.objects.filter(user=self)

        for doc in user_docs:
            for doc_ver in doc.versions.all():
                doc_ver.file_path.unlink(missing_ok=True)
                for page in doc_ver.pages.all():
                    page.txt_path.unlink(missing_ok=True)
                    page.jpg_path.unlink(missing_ok=True)
                    page.svg_path.unlink(missing_ok=True)
                    page.hocr_path.unlink(missing_ok=True)
                    try:
                        page.txt_path.parent.rmdir()
                    except FileNotFoundError:
                        logger.info(f"Directory {page.txt_path.parent} does not exist")
