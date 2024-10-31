from datetime import datetime
from typing import Optional
from uuid import UUID

from papermerge.core.constants import INCOMING_DATE_FORMAT
from papermerge.core.exceptions import InvalidDateFormat


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
        INCOMING_DATE_FORMAT,
    ).date()
