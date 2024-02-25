import logging
import uuid
from uuid import UUID

from passlib.hash import pbkdf2_sha256
from sqlalchemy import Engine, select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from papermerge.core import constants, schemas
from papermerge.core.db.models import Folder, User
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
        try:
            db_user = session.scalars(stmt, params).one()
        except NoResultFound:
            raise UserNotFound()

        if db_user is None:
            raise UserNotFound(
                f"User with id/username='{user_id_or_username}' not found"
            )

        logger.debug(f"User {db_user} fetched")
        model_user = schemas.User.model_validate(db_user)

    return model_user


def create_user(
    engine: Engine,
    username: str,
    email: str,
    password: str
) -> schemas.User:

    with Session(engine) as session:
        user_id = uuid.uuid4()
        home_folder_id = uuid.uuid4()
        inbox_folder_id = uuid.uuid4()

        db_user = User(
            id=user_id,
            username=username,
            email=email,
            password=pbkdf2_sha256.hash(password),
        )
        db_inbox = Folder(
            id=inbox_folder_id,
            title=constants.INBOX_TITLE,
            ctype=constants.CTYPE_FOLDER,
            user_id=user_id,
            lang='xxx'  # not used
        )
        db_home = Folder(
            id=home_folder_id,
            title=constants.HOME_TITLE,
            ctype=constants.CTYPE_FOLDER,
            user_id=user_id,
            lang='xxx'  # not used
        )
        session.add(db_user)
        session.add(db_home)
        session.add(db_inbox)
        session.commit()

        db_user.home_folder_id = db_home.id
        db_user.inbox_folder_id = db_inbox.id
        session.commit()

        user = schemas.User.model_validate(db_user)

    return user
