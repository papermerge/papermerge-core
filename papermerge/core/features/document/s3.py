from uuid import UUID

from core.types import ImagePreviewSize
from papermerge.core import pathlib as plib
from papermerge.core import config

settings = config.get_settings()

VALID_FOR_SECONDS = 600


def resource_sign_url(prefix, resource_path):
    from papermerge.core.cloudfront import sign_url

    if prefix:
        url = f"https://{settings.papermerge__main__cf_domain}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.papermerge__main__cf_domain}/{resource_path}"

    return sign_url(
        url,
        valid_for=VALID_FOR_SECONDS,
    )


def doc_thumbnail_signed_url(uid: UUID) -> str:
    resource_path = plib.thumbnail_path(uid)
    prefix = settings.papermerge__main__prefix

    return resource_sign_url(prefix, resource_path)


def page_image_jpg_signed_url(uid: UUID, size: ImagePreviewSize) -> str:

    resource_path = plib.page_preview_jpg_path(uid, size=size)
    prefix = settings.papermerge__main__prefix

    return resource_sign_url(prefix, resource_path)
