from uuid import UUID
from urllib.parse import quote
from pathlib import Path

from papermerge.core.types import ImagePreviewSize
from papermerge.core import pathlib as plib
from papermerge.core import config

settings = config.get_settings()

VALID_FOR_SECONDS = 600


def resource_sign_url(prefix, resource_path: Path):
    from papermerge.core.cloudfront import sign_url

    encoded_path = quote(str(resource_path))

    if prefix:
        url = f"https://{settings.cf_domain}/{prefix}/{encoded_path}"
    else:
        url = f"https://{settings.cf_domain}/{encoded_path}"

    return sign_url(
        url,
        valid_for=VALID_FOR_SECONDS,
    )


def doc_thumbnail_signed_url(uid: UUID) -> str:
    resource_path = plib.thumbnail_path(uid)
    prefix = settings.prefix

    return resource_sign_url(prefix, resource_path)


def page_image_jpg_signed_url(uid: UUID, size: ImagePreviewSize) -> str:
    resource_path = plib.page_preview_jpg_path(uid, size=size)
    prefix = settings.prefix

    return resource_sign_url(prefix, resource_path)


def doc_ver_signed_url(
    doc_ver_id: UUID,
    file_name: str
) -> str:
    resource_path = plib.docver_path(doc_ver_id, file_name=file_name)
    prefix = settings.prefix

    return resource_sign_url(prefix, resource_path)
