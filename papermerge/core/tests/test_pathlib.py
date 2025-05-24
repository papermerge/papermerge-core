import uuid
from pathlib import Path

from papermerge.core.types import ImagePreviewSize
from papermerge.core import constants as const
from papermerge.core import pathlib as plib


def test_thumbnail_path_1():
    uid = uuid.uuid4()
    str_uuid = str(uid)
    actual = plib.thumbnail_path(uid)

    expected = Path(
        const.THUMBNAILS,
        const.JPG,
        str_uuid[0:2],
        str_uuid[2:4],
        str_uuid,
        f"{ImagePreviewSize.sm.value}.{const.JPG}",
    )

    assert actual == expected


def test_page_preview_jpg_path():
    uid = uuid.uuid4()
    str_uuid = str(uid)

    actual = plib.page_preview_jpg_path(uid, ImagePreviewSize.md)
    expected = Path(
        const.PREVIEWS,
        const.PAGES,
        str_uuid[0:2],
        str_uuid[2:4],
        str_uuid,
        f"{ImagePreviewSize.md.value}.{const.JPG}",
    )

    assert actual == expected
