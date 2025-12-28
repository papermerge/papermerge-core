from pathlib import Path
from uuid import UUID

from papermerge.core import constants as const
from papermerge.core.config import get_settings
from papermerge.core.types import ImagePreviewSize

config = get_settings()

__all__ = [
    'thumbnail_path',
    'docver_path',
    'page_txt_path',
    'page_path',
    'page_svg_path',
    'page_preview_jpg_path',
    'page_hocr_path',
    'abs_thumbnail_path',
    'abs_docver_path',
    'abs_page_txt_path',
    'abs_page_path',
    'abs_page_svg_path',
    'abs_page_jpg_path',
    'abs_page_hocr_path',
    'rel2abs'
]


def thumbnail_path(
    uuid: UUID | str
) -> Path:
    """
    Relative path to the page thumbnail image.
    """
    uuid_str = str(uuid)

    return Path(
        const.THUMBNAILS,
        const.JPG,
        uuid_str[0:2],
        uuid_str[2:4],
        uuid_str,
        f"{ImagePreviewSize.sm.value}.{const.JPG}"
    )


def abs_thumbnail_path(
    uuid: UUID | str
) -> Path:
    return Path(
        config.media_root,
        thumbnail_path(uuid)
    )


def docver_path(
    uuid: UUID | str,
    file_name: str
) -> Path:
    uuid_str = str(uuid)

    return Path(
        const.DOCVERS,
        uuid_str[0:2],
        uuid_str[2:4],
        uuid_str,
        file_name
    )


def abs_docver_path(
    uuid: UUID | str,
    file_name: str
):
    return Path(
        config.media_root,
        docver_path(uuid, file_name)
    )


def page_path(
    uuid: UUID | str,
) -> Path:
    uuid_str = str(uuid)

    return Path(
        const.OCR,
        const.PAGES,
        uuid_str[0:2],
        uuid_str[2:4],
        uuid_str
    )

def page_preview_path(
    uuid: UUID | str,
) -> Path:
    uuid_str = str(uuid)

    return Path(
        const.PREVIEWS,
        const.PAGES,
        uuid_str[0:2],
        uuid_str[2:4],
        uuid_str
    )


def abs_page_path(uuid: UUID | str) -> Path:
    return Path(config.media_root) / page_path(uuid)


def page_txt_path(
    uuid: UUID | str,
) -> Path:
    return page_path(uuid) / 'page.txt'


def page_svg_path(
    uuid: UUID | str,
) -> Path:
    return page_path(uuid) / 'page.svg'


def page_preview_jpg_path(
    uuid: UUID | str,
    size: ImagePreviewSize
) -> Path:
    return page_preview_path(uuid) / f'{size.value}.jpg'


def abs_page_preview_jpg_path(
    uuid: UUID | str,
    size: ImagePreviewSize = ImagePreviewSize.md
) -> Path:
    return Path(config.media_root) / page_preview_jpg_path(uuid, size=size)


def page_hocr_path(
    uuid: UUID | str,
) -> Path:
    return page_path(uuid) / 'page.hocr'


def abs_page_txt_path(
    uuid: UUID | str
) -> Path:
    return Path(config.media_root) / page_txt_path(uuid)


def abs_page_svg_path(
    uuid: UUID | str
) -> Path:
    return Path(config.media_root) / page_svg_path(uuid)


def abs_page_jpg_path(
    uuid: UUID | str
) -> Path:
    return Path(config.media_root) / page_jpg_path(uuid)


def abs_page_hocr_path(
    uuid: UUID | str
) -> Path:
    return Path(config.media_root) / page_hocr_path(uuid)


def rel2abs(rel_path: Path) -> Path:
    """Converts relative path to absolute path"""
    return Path(config.media_root) / rel_path
