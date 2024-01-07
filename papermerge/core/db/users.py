import logging
from datetime import datetime
from uuid import UUID

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import User
from papermerge.core.utils.misc import is_valid_uuid

from .exceptions import UserNotFound

logger = logging.getLogger(__name__)

DATETIME_FMT = '%Y-%m-%d %H:%M:%S.%f'


def get_user(
    engine: Engine,
    user_id_or_username: str
) -> schemas.User:

    logger.debug(f"user_id_or_username={user_id_or_username}")

    if is_valid_uuid(user_id_or_username):
        stmt = select(User).where(User.id == UUID(user_id_or_username))
        params = {"id": user_id_or_username}
    else:
        stmt = select(User).where(User.username == user_id_or_username)
        params = {"username": user_id_or_username}

    with Session(engine) as session:
        db_user = session.scalars(stmt, params).one()

        if db_user is None:
            raise UserNotFound(
                f"User with id/username='{user_id_or_username}' not found"
            )

        logger.debug(f"User {db_user} fetched")
        model_user = schemas.User.model_validate(db_user)

    return model_user


def _get_uuid(value: UUID | str) -> UUID:
    if isinstance(value, UUID):
        return value

    return UUID(value)


def _get_datetime(value: datetime | str) -> datetime:
    if isinstance(value, datetime):
        return value

    return datetime.strptime(value, DATETIME_FMT)
