import logging
from datetime import datetime
from uuid import UUID

from sqlalchemy import Engine, text

from papermerge.core import schemas

from .exceptions import UserNotFound

logger = logging.getLogger(__name__)

DATETIME_FMT = '%Y-%m-%d %H:%M:%S.%f'


def get_user(
    engine: Engine,
    user_id_or_username
) -> schemas.User:

    logger.debug(f"user_id_or_username={user_id_or_username}")

    try:
        id_hex = UUID(user_id_or_username).hex
    except ValueError:
        id_hex = '-'

    with engine.connect() as connection:
        result = connection.execute(
            text(
                "SELECT id, username, email, created_at, updated_at, "
                "home_folder_id, inbox_folder_id FROM core_user "
                "WHERE id = :id_hex OR id = :id OR username = :username"
            ),
            {
                "id_hex": id_hex,
                "id": user_id_or_username,
                "username": user_id_or_username
            }
        )

        result_list = list(result)
        if len(result_list) == 0:
            raise UserNotFound(
                f"User with id/username='{user_id_or_username}' not found"
            )

        user = result_list[0]
        logger.debug(f"User {user} fetched")

        found_user = schemas.User(
            id=_get_uuid(user[0]),
            username=user[1],
            email=user[2],
            created_at=_get_datetime(user[3]),
            updated_at=_get_datetime(user[4]),
            home_folder_id=_get_uuid(user[5]),
            inbox_folder_id=_get_uuid(user[6]),
        )

    return found_user


def _get_uuid(value: UUID | str) -> UUID:
    if isinstance(value, UUID):
        return value

    return UUID(value)


def _get_datetime(value: datetime | str) -> datetime:
    if isinstance(value, datetime):
        return value

    return datetime.strptime(value, DATETIME_FMT)
