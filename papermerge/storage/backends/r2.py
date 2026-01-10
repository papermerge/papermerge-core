import logging
from uuid import UUID
from typing import Tuple

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile

from papermerge.core.config import get_settings
from papermerge.core import pathlib as plib
from papermerge.core.types import ImagePreviewSize
from papermerge.storage.base import StorageBackend
from papermerge.storage.exc import StorageUploadError, FileTooLargeError

logger = logging.getLogger(__name__)


class R2Backend(StorageBackend):
    """
    Cloudflare R2 storage backend using S3-compatible presigned URLs.

    R2 is S3-compatible, so we use boto3 with a custom endpoint.
    """

    def __init__(self):
        self.settings = get_settings()
        self._validate_settings()
        self._client = None

    def _validate_settings(self):
        if not self.settings.r2_account_id:
            raise ValueError("R2_ACCOUNT_ID is not configured")
        if not self.settings.r2_access_key_id:
            raise ValueError("R2_ACCESS_KEY_ID is not configured")
        if not self.settings.r2_secret_access_key:
            raise ValueError("R2_SECRET_ACCESS_KEY is not configured")
        if not self.settings.bucket_name:
            raise ValueError("BUCKET_NAME is not configured")

    @property
    def client(self):
        """Lazy-loaded boto3 S3 client for R2."""
        if self._client is None:
            self._client = boto3.client(
                's3',
                endpoint_url=self.settings.r2_endpoint_url,
                aws_access_key_id=self.settings.r2_access_key_id,
                aws_secret_access_key=self.settings.r2_secret_access_key,
                config=Config(signature_version='s3v4'),
                region_name='auto',  # Required by SDK but not used by R2
            )
        return self._client

    async def upload_file(
        self,
        file: UploadFile,
        object_key: str,
        content_type: str,
        max_file_size: int
    ) -> Tuple[int, bytes]:
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
            logger.info(f"Uploaded file to R2: {full_key}")
            return len(content), content
        except Exception as e:
            logger.error(f"R2 upload failed for {full_key}: {e}")
            raise StorageUploadError(f"Upload failed: {e}")

    def _build_object_key(self, resource_path) -> str:
        """Build the S3 object key with optional prefix."""
        prefix = self.settings.prefix
        path_str = str(resource_path)

        if prefix:
            return f"{prefix}/{path_str}"
        return path_str

    def sign_url(self, url: str, valid_for: int = StorageBackend.DEFAULT_VALID_FOR_SECONDS) -> str:
        """
        Sign a URL for R2 access.

        Note: For R2, the 'url' parameter is interpreted as the object key/path,
        not a full URL. This differs from CloudFront where we sign complete URLs.
        """
        object_key = url  # In R2 context, we pass the object key
        return self._generate_presigned_url(object_key, valid_for)

    def _generate_presigned_url(
        self,
        object_key: str,
        valid_for: int = StorageBackend.DEFAULT_VALID_FOR_SECONDS
    ) -> str:
        """Generate a presigned URL for downloading an object from R2."""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.settings.r2_bucket_name,
                    'Key': object_key,
                },
                ExpiresIn=valid_for,
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL for {object_key}: {e}")
            raise

    def doc_thumbnail_signed_url(self, uid: UUID) -> str:
        resource_path = plib.thumbnail_path(uid)
        object_key = self._build_object_key(resource_path)
        return self._generate_presigned_url(object_key)

    def page_image_jpg_signed_url(self, uid: UUID, size: ImagePreviewSize) -> str:
        resource_path = plib.page_preview_jpg_path(uid, size=size)
        object_key = self._build_object_key(resource_path)
        return self._generate_presigned_url(object_key)

    def doc_ver_signed_url(self, doc_ver_id: UUID, file_name: str) -> str:
        resource_path = plib.docver_path(doc_ver_id, file_name=file_name)
        object_key = self._build_object_key(resource_path)
        return self._generate_presigned_url(object_key)
