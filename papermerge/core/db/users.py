import logging
from datetime import datetime
from uuid import UUID

from sqlalchemy import Engine, select

from papermerge.core import schemas
from papermerge.core.db.tables import users_table
from papermerge.core.utils.misc import is_valid_uuid

from .exceptions import UserNotFound

logger = logging.getLogger(__name__)

DATETIME_FMT = '%Y-%m-%d %H:%M:%S.%f'


def get_user(
    engine: Engine,
    user_id_or_username: str
) -> schemas.User:

    logger.debug(f"user_id_or_username={user_id_or_username}")

    stmt = select(
        users_table.c.id,
        users_table.c.username,
        users_table.c.email,
        users_table.c.created_at,
        users_table.c.updated_at,
        users_table.c.home_folder_id,
        users_table.c.inbox_folder_id,
    )

    if is_valid_uuid(user_id_or_username):
        stmt = stmt.where(users_table.c.id == UUID(user_id_or_username))
        params = {"id": user_id_or_username}
    else:
        stmt = stmt.where(users_table.c.username == user_id_or_username)
        params = {"username": user_id_or_username}

    with engine.connect() as connection:
        result = connection.execute(stmt, params)

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
