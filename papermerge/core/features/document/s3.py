from pathlib import Path
from urllib.parse import quote
from uuid import UUID

import boto3
from botocore.config import Config

from papermerge.core import config
from papermerge.core import pathlib as plib
from papermerge.core.types import ImagePreviewSize

settings = config.get_settings()

VALID_FOR_SECONDS = 600


def generate_s3_signed_url(path: str):
    client = boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region_name,
        endpoint_url=settings.aws_endpoint_url,
        config=Config(signature_version="s3v4"),
    )
    return client.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": settings.papermerge__s3__bucket_name, "Key": path},
        ExpiresIn=VALID_FOR_SECONDS,
    )


def resource_sign_url(prefix, resource_path: Path):
    encoded_path = quote(str(resource_path))
    path = encoded_path if not prefix else f"{prefix}/{encoded_path}"
    # if a cloudFront domain is configured -> generate a signed url via cloudFront
    # else -> generate a direct signed url to object storage
    if settings.papermerge__main__cf_domain is not None:
        from papermerge.core.cloudfront import sign_url

        return sign_url(
            f"https://{settings.papermerge__main__cf_domain}/{path}",
            valid_for=VALID_FOR_SECONDS,
        )
    else:
        return generate_s3_signed_url(path=path)


def doc_thumbnail_signed_url(uid: UUID) -> str:
    resource_path = plib.thumbnail_path(uid)
    prefix = settings.papermerge__main__prefix

    return resource_sign_url(prefix, resource_path)


def page_image_jpg_signed_url(uid: UUID, size: ImagePreviewSize) -> str:
    resource_path = plib.page_preview_jpg_path(uid, size=size)
    prefix = settings.papermerge__main__prefix

    return resource_sign_url(prefix, resource_path)


def doc_ver_signed_url(
    doc_ver_id: UUID,
    file_name: str
) -> str:
    resource_path = plib.docver_path(doc_ver_id, file_name=file_name)
    prefix = settings.papermerge__main__prefix

    return resource_sign_url(prefix, resource_path)
