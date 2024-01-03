from datetime import datetime
from uuid import UUID

from sqlalchemy import Engine, text

from papermerge.core import schemas
from papermerge.core.utils import misc as misc_utils


def get_user(
    engine: Engine,
    user_id_or_username
) -> schemas.User:

    if misc_utils.is_valid_uuid(user_id_or_username):
        return _get_user_by_id(engine, user_id_or_username)

    return _get_user_by_username(engine, user_id_or_username)


def _get_user_by_id(
    engine: Engine,
    user_id
):
    with engine.connect() as connection:
        result = connection.execute(
            text(
                "SELECT id, username, email, created_at, updated_at, "
                "home_folder_id, inbox_folder_id FROM core_users "
                "WHERE id = :id"
            ),
            {"id": user_id}
        )

        user = list(result)[0]
        found_user = schemas.User(
            id=UUID(user[0]),
            username=user[1],
            email=user[2],
            created_at=datetime.strptime(user[3], '%Y-%m/%d %H:%M:%S'),
            updated_at=datetime.strptime(user[4], '%Y-%m/%d %H:%M:%S'),
            home_folder_id=UUID(user[5]),
            inbox_folder_id=UUID(user[6]),
        )

    return found_user


def _get_user_by_username(
    engine: Engine,
    username
):
    with engine.connect() as connection:
        result = connection.execute(
            text(
                "SELECT id, username, email, created_at, updated_at, "
                "home_folder_id, inbox_folder_id FROM core_user "
                "WHERE username = :username"
            ),
            {"username": username}
        )

        user = list(result)[0]
        found_user = schemas.User(
            id=UUID(user[0]),
            username=user[1],
            email=user[2],
            created_at=datetime.strptime(user[3], '%Y-%m/%d %H:%M:%S'),
            updated_at=datetime.strptime(user[4], '%Y-%m/%d %H:%M:%S'),
            home_folder_id=UUID(user[5]),
            inbox_folder_id=UUID(user[6]),
        )

    return found_user
