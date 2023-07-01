from pathlib import Path
from uuid import UUID

from django.conf import settings

__all__ = ['thumbnail_path', 'rel2abs']


def thumbnail_path(uuid: UUID, size: int) -> Path:
    """
    Relative path to the thumbnail image.
    """
    uuid_str = str(uuid)

    return Path(
        "thumbnails",
        uuid_str[0:2],
        uuid_str[2:4],
        uuid_str,
        f"{size}.jpg"
    )


def rel2abs(rel_path: Path) -> Path:
    """Converts relative path to absolute path"""
    return Path(settings.MEDIA_ROOT, rel_path)
