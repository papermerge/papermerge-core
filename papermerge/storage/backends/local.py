from uuid import UUID
import logging

from fastapi import UploadFile

from papermerge.core.config import get_settings
from papermerge.storage.base import StorageBackend
from papermerge.storage.exc import FileTooLargeError

logger = logging.getLogger(__name__)

class LocalBackend(StorageBackend):
    def __init__(self):
        self.settings = get_settings()
        self._client = None

    @property
    def client(self):
        return self._client

    async def upload_file(
        self,
        file: UploadFile,
        object_key: str,
        content_type: str,
        max_file_size: int
    ) -> int:
        """Save file to local filesystem"""
        file_path = self.settings.media_root / object_key
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Read and validate size
        content = await file.read()

        if len(content) > max_file_size:
            raise FileTooLargeError(
                f"File size {len(content)} exceeds maximum {max_file_size}"
            )

        # Write to disk
        with open(file_path, 'wb') as f:
            f.write(content)

        logger.info(f"Saved file to local storage: {file_path}")
        return len(content)


    def sign_url(self, url: str, valid_for = 600):
        pass

    def doc_thumbnail_signed_url(self, uid: UUID) -> str:
        pass

    def page_image_jpg_signed_url(self, uid: UUID, size):
        pass

    def doc_ver_signed_url(self, doc_ver_id: UUID, file_name: str) -> str:
        pass
