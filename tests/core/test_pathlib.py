import uuid
from pathlib import Path

from papermerge.core.constants import (DEFAULT_DOCUMENT_THUMBNAIL_SIZE, JPG,
                                       THUMBNAILS)
from papermerge.core.pathlib import document_thumbnail_path


def test_thumbnail_path_1():
    uid = uuid.uuid4()
    str_uuid = str(uid)
    actual = document_thumbnail_path(uid)

    expected = Path(
        THUMBNAILS,
        str_uuid[0:2],
        str_uuid[2:4],
        str_uuid,
        f"{DEFAULT_DOCUMENT_THUMBNAIL_SIZE}.{JPG}"
    )

    assert actual == expected


def test_thumbnail_path_2():
    uid = uuid.uuid4()
    str_uuid = str(uid)
    actual = document_thumbnail_path(uid, size=200)

    expected = Path(
        THUMBNAILS,
        str_uuid[0:2],
        str_uuid[2:4],
        str_uuid,
        f"200.{JPG}"
    )

    assert actual == expected
