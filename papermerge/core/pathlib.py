from pathlib import Path
from uuid import UUID

from django.conf import settings

from papermerge.core import constants as const

__all__ = ['thumbnail_path', 'rel2abs']


def thumbnail_path(
    uuid: UUID | str,
    size: int = const.DEFAULT_THUMBNAIL_SIZE
) -> Path:
    """
    Relative path to the page thumbnail image.
    """
    uuid_str = str(uuid)

    return Path(
        const.PAGES,
        const.JPG,
        uuid_str[0:2],
        uuid_str[2:4],
        uuid_str,
        f"{size}.{const.JPG}"
    )


def abs_thumbnail_path(
    uuid: UUID | str,
    size: int = const.DEFAULT_THUMBNAIL_SIZE
) -> Path:
    return Path(
        settings.MEDIA_ROOT,
        thumbnail_path(uuid, size)
    )


def document_path(
    uuid: UUID | str,
    file_name: str
) -> Path:
    uuid_str = str(uuid)

    return Path(
        const.DOCS,
        uuid_str[0:2],
        uuid_str[2:4],
        file_name
    )


def abs_document_path(
    uuid: UUID | str,
    file_name: str
):
    return Path(
        settings.MEDIA_ROOT,
        document_path(uuid, file_name)
    )


def rel2abs(rel_path: Path) -> Path:
    """Converts relative path to absolute path"""
    return Path(settings.MEDIA_ROOT, rel_path)
