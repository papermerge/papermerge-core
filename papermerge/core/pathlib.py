from pathlib import Path
from uuid import UUID

from django.conf import settings

from papermerge.core import constants as const

__all__ = ['document_thumbnail_path', 'rel2abs', 'page_thumbnail_path']


def document_thumbnail_path(
    uuid: UUID,
    size: int = const.DEFAULT_DOCUMENT_THUMBNAIL_SIZE
) -> Path:
    """
    Relative path to the document thumbnail image.
    """
    uuid_str = str(uuid)

    return Path(
        const.THUMBNAILS,
        uuid_str[0:2],
        uuid_str[2:4],
        uuid_str,
        f"{size}.{const.JPG}"
    )


def page_thumbnail_path(
    uuid: UUID,
    size: int = const.DEFAULT_PAGE_THUMBNAIL_SIZE
) -> Path:
    uuid_str = str(uuid)

    return Path(
        const.PAGES,
        const.JPG,
        uuid_str[0:2],
        uuid_str[2:4],
        uuid_str,
        f"{size}.{const.JPG}"
    )


def rel2abs(rel_path: Path) -> Path:
    """Converts relative path to absolute path"""
    return Path(settings.MEDIA_ROOT, rel_path)
