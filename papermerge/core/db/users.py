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
                "SELECT id, username, email, created_at, updated_at "
                "home_folder_id, inbox_folder_id FROM core_users "
                "WHERE id = :id",
                {"id": user_id}
            )
        )

        user = list(result)[0]
        found_user = schemas.User(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            created_at=user["created_at"],
            updated_at=user["updated_at"],
            home_folder_id=user["home_folder_id"],
            inbox_folder_id=user["inbox_folder_id"],
        )

    return found_user


def _get_user_by_username(
    engine: Engine,
    username
):
    with engine.connect() as connection:
        result = connection.execute(
            text(
                "SELECT id, username, email, created_at, updated_at "
                "home_folder_id, inbox_folder_id FROM core_users "
                "WHERE username = :username",
                {"username": username}
            )
        )

        user = list(result)[0]
        found_user = schemas.User(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            created_at=user["created_at"],
            updated_at=user["updated_at"],
            home_folder_id=user["home_folder_id"],
            inbox_folder_id=user["inbox_folder_id"],
        )

    return found_user
