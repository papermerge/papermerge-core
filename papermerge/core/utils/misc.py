import io
import logging
import math
import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional
from uuid import UUID


from papermerge.core import constants
from papermerge.core.exceptions import InvalidDateFormat


logger = logging.getLogger(__name__)


def is_valid_uuid(uuid_to_test: str) -> bool:
    """
    Check if uuid_to_test is a valid UUID.

    Returns `True` if uuid_to_test is a valid UUID, otherwise `False`.

    Examples
    --------
    >>> is_valid_uuid('c9bf9e57-1685-4c89-bafb-ff5af830be8a')
    True
    >>> is_valid_uuid('c9bf9e58')
    False
    """

    try:
        uuid_obj = UUID(uuid_to_test, version=4)
    except ValueError:
        return False

    return str(uuid_obj) == uuid_to_test


def str2date(value: str | None) -> Optional[datetime.date]:
    """Convert incoming user string to datetime.date"""
    # 10 = 4 Y chars +  1 "-" char + 2 M chars + 1 "-" char + 2 D chars
    if value is None:
        return None

    DATE_LEN = 10
    stripped_value = value.strip()
    if len(stripped_value) == 0:
        return None

    if len(stripped_value) < DATE_LEN and len(stripped_value) > 0:
        raise InvalidDateFormat(
            f"{stripped_value} expected to have at least {DATE_LEN} characters"
        )

    return datetime.strptime(
        value[:DATE_LEN],
        constants.INCOMING_DATE_FORMAT,
    ).date()


def str2float(value: str | None) -> Optional[float]:
    """Convert incoming user string to float

    2023-11 -> 2023.11
    2022-02 -> 2022.02
    2018-09 -> 2018.09
    2024-12 -> 2024.12
    """
    # 7 = 4 Y chars +  1 "-" char + 2 M chars
    if value is None:
        return None

    DATE_LEN = 7
    stripped_value = value.strip()
    if len(stripped_value) == 0:
        return None

    if len(stripped_value) < DATE_LEN and len(stripped_value) > 0:
        raise InvalidDateFormat(
            f"{stripped_value} expected to have at least {DATE_LEN} characters"
        )

    dt = datetime.strptime(
        value[:DATE_LEN],
        constants.INCOMING_YEARMONTH_FORMAT,
    )
    year = dt.year
    month = dt.month

    return year + month / 100


def float2str(value: float | str | None) -> Optional[str]:
    """
    2024.01 -> "2024-01"
    2018.09 -> "2018-09"
    """
    if value is None:
        return None

    value = float(value)
    year = int(value)
    fraction = value - year
    if fraction in (0.1, 0.11, 0.12):
        month = math.ceil(fraction * 10)
    else:
        month = math.ceil(fraction * 100)

    return f"{year}-{month:02d}"


def copy_file(src: Path | io.BytesIO | bytes, dst: Path):
    """Copy source file to destination"""
    logger.debug(f"copying {src} to {dst}")
    if not dst.parent.exists():
        os.makedirs(dst.parent, exist_ok=True)

    if isinstance(src, Path):
        logger.debug(f"{src} is a Path instance")
        shutil.copyfile(src, dst)
    elif isinstance(src, io.BytesIO):
        with open(dst, "wb") as f:
            f.write(src.getvalue())
    elif isinstance(src, bytes):
        with open(dst, "wb") as f:
            f.write(src)
    else:
        raise ValueError(
            f"src ({src}) is neither instance of DocumentPath, io.Bytes, bytes"
        )
