from uuid import UUID
from urllib.parse import quote
from pathlib import Path

from papermerge.core.types import ImagePreviewSize
from papermerge.core import pathlib as plib
from papermerge.core import config
from papermerge.core.storage.factory import get_storage

settings = config.get_settings()

VALID_FOR_SECONDS = 600


def resource_sign_url(prefix, resource_path: Path):
    provider = get_storage()

    path = str(resource_path) if not prefix else f"{prefix}/{resource_path}"

    return provider.sign_url(
        path,
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


def doc_ver_signed_url(
    doc_ver_id: UUID,
    file_name: str
) -> str:
    resource_path = plib.docver_path(doc_ver_id, file_name=file_name)
    prefix = settings.papermerge__main__prefix

    return resource_sign_url(prefix, resource_path)
