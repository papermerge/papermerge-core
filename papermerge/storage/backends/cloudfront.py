import logging
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote
from uuid import UUID

from fastapi import UploadFile
from botocore.signers import CloudFrontSigner
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from papermerge.storage.exc import StorageUploadError, FileTooLargeError
from papermerge.core.config import get_settings
from papermerge.core.cache import client as cache
from papermerge.core.utils.tz import utc_now
from papermerge.core import pathlib as plib
from papermerge.core.types import ImagePreviewSize
from papermerge.storage.base import StorageBackend

PEM_PRIVATE_KEY_STRING = "pem-private-key-string"
PEM_PRIVATE_KEY_TTL = 600

logger = logging.getLogger(__name__)

class CloudFrontBackend(StorageBackend):
    """AWS CloudFront storage backend using RSA-signed URLs."""

    def __init__(self):
        self.settings = get_settings()
        self._validate_settings()
        self._client = None

    def _validate_settings(self):
        if not self.settings.cf_sign_url_key_id:
            raise ValueError("CF_SIGN_URL_KEY_ID is not configured")
        if not self.settings.cf_sign_url_private_key:
            raise ValueError("CF_SIGN_URL_PRIVATE_KEY is not configured")
        if not self.settings.cf_domain:
            raise ValueError("CF_DOMAIN is not configured")


    async def upload_file(
        self,
        file: UploadFile,
        object_key: str,
        content_type: str,
        max_file_size: int
    ) -> int:
        """Stream file to R2"""
        content = await file.read()

        if len(content) > max_file_size:
            raise FileTooLargeError(
                f"File size {len(content)} exceeds maximum {max_file_size}"
            )

        # Add prefix if configured
        full_key = str(self.prefix / object_key) if self.prefix else object_key

        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=full_key,
                Body=content,
                ContentType=content_type
            )
            logger.info(f"Uploaded file to AWS S3: {full_key}")
            return len(content)
        except Exception as e:
            logger.error(f"AWS S3 upload failed for {full_key}: {e}")
            raise StorageUploadError(f"Upload failed: {e}")

    def _rsa_signer(self, message: bytes) -> bytes:
        """RSA signer for CloudFront URLs."""
        private_key_string = cache.get(PEM_PRIVATE_KEY_STRING)

        if private_key_string is not None:
            private_key = serialization.load_pem_private_key(
                private_key_string,
                password=None,
                backend=default_backend()
            )
            return private_key.sign(message, padding.PKCS1v15(), hashes.SHA1())

        key_path = Path(self.settings.cf_sign_url_private_key)
        if not key_path.exists():
            raise ValueError(f"{key_path} does not exist")

        with open(key_path, 'rb') as key_file:
            private_key_string = key_file.read()
            private_key = serialization.load_pem_private_key(
                private_key_string,
                password=None,
                backend=default_backend()
            )
            cache.set(
                PEM_PRIVATE_KEY_STRING,
                private_key_string,
                ex=PEM_PRIVATE_KEY_TTL
            )

        return private_key.sign(message, padding.PKCS1v15(), hashes.SHA1())

    def sign_url(self, url: str, valid_for: int = StorageBackend.DEFAULT_VALID_FOR_SECONDS) -> str:
        """Sign a CloudFront URL."""
        cf_signer = CloudFrontSigner(self.settings.cf_sign_url_key_id, self._rsa_signer)
        date_less_than = utc_now() + timedelta(seconds=valid_for)
        return cf_signer.generate_presigned_url(url, date_less_than=date_less_than)

    def _build_url(self, resource_path: Path) -> str:
        """Build the full CloudFront URL for a resource."""
        encoded_path = quote(str(resource_path))
        prefix = self.settings.prefix

        if prefix:
            return f"https://{self.settings.cf_domain}/{prefix}/{encoded_path}"
        return f"https://{self.settings.cf_domain}/{encoded_path}"

    def doc_thumbnail_signed_url(self, uid: UUID) -> str:
        resource_path = plib.thumbnail_path(uid)
        url = self._build_url(resource_path)
        return self.sign_url(url)

    def page_image_jpg_signed_url(self, uid: UUID, size: ImagePreviewSize) -> str:
        resource_path = plib.page_preview_jpg_path(uid, size=size)
        url = self._build_url(resource_path)
        return self.sign_url(url)

    def doc_ver_signed_url(self, doc_ver_id: UUID, file_name: str) -> str:
        resource_path = plib.docver_path(doc_ver_id, file_name=file_name)
        url = self._build_url(resource_path)
        return self.sign_url(url)


# For backwards compatibility with CLI tool
def sign_url(url: str, valid_for: int = 600) -> str:
    """Standalone function for signing URLs (used by CLI)."""
    backend = CloudFrontBackend()
    return backend.sign_url(url, valid_for)
