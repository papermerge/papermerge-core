from abc import ABC, abstractmethod
from uuid import UUID

from papermerge.core.types import ImagePreviewSize


class StorageBackend(ABC):
    """Abstract base class for cloud storage backends."""

    DEFAULT_VALID_FOR_SECONDS = 600

    @abstractmethod
    def sign_url(self, url: str, valid_for: int = DEFAULT_VALID_FOR_SECONDS) -> str:
        """
        Sign a URL for secure access.

        :param url: The URL or resource path to sign
        :param valid_for: Number of seconds the URL will be valid for
        :return: Signed URL
        """
        pass

    @abstractmethod
    def doc_thumbnail_signed_url(self, uid: UUID) -> str:
        """Generate a signed URL for a document thumbnail."""
        pass

    @abstractmethod
    def page_image_jpg_signed_url(self, uid: UUID, size: ImagePreviewSize) -> str:
        """Generate a signed URL for a page preview image."""
        pass

    @abstractmethod
    def doc_ver_signed_url(self, doc_ver_id: UUID, file_name: str) -> str:
        """Generate a signed URL for downloading a document version."""
        pass


def get_storage_backend() -> StorageBackend:
    """
    Factory function to get the appropriate storage backend
    based on configuration.
    """
    from papermerge.core.config import get_settings, FileServer

    settings = get_settings()

    if settings.file_server == FileServer.S3:
        from papermerge.storage.backends.cloudfront import CloudFrontBackend
        return CloudFrontBackend()
    elif settings.file_server == FileServer.R2:
        from papermerge.storage.backends.r2 import R2Backend
        return R2Backend()
    else:
        raise ValueError(
            f"No cloud storage backend for file_server={settings.file_server}. "
            "Cloud storage backends are only available for S3 and R2."
        )
