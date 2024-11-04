import uuid
import logging
from typing import Tuple

from passlib.hash import pbkdf2_sha256
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound


from papermerge.core.db.engine import Session
from papermerge.core.utils.misc import is_valid_uuid
from papermerge.core.features.auth import scopes
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.nodes.db import orm as nodes_orm
from papermerge.core.features.groups.db import orm as group_orm
from papermerge.core import constants
from papermerge.core.schemas import error as err_schema

from .orm import User

DATETIME_FMT = "%Y-%m-%d %H:%M:%S.%f"

logger = logging.getLogger(__name__)


def get_user(db_session: Session, user_id_or_username: str) -> usr_schema.User:
    logger.debug(f"user_id_or_username={user_id_or_username}")

    if is_valid_uuid(user_id_or_username):
        stmt = select(User).where(User.id == uuid.UUID(user_id_or_username))
        params = {"id": user_id_or_username}
    else:
        stmt = select(User).where(User.username == user_id_or_username)
        params = {"username": user_id_or_username}

    try:
        db_user = db_session.scalars(stmt, params).one()
    except NoResultFound:
        raise UserNotFound()

    if db_user is None:
        raise UserNotFound(f"User with id/username='{user_id_or_username}' not found")

    logger.debug(f"User {db_user} fetched")
    model_user = usr_schema.User.model_validate(db_user)

    return model_user


def get_user_details(
    db_session, user_id: uuid.UUID
) -> [usr_schema.UserDetails | None, err_schema.Error | None]:
    stmt = select(User).where(User.id == user_id)
    params = {"id": user_id}

    try:
        db_user = db_session.scalars(stmt, params).one()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    result = usr_schema.UserDetails(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        created_at=db_user.created_at,
        updated_at=db_user.updated_at,
        home_folder_id=db_user.home_folder_id,
        inbox_folder_id=db_user.inbox_folder_id,
        is_superuser=db_user.is_superuser,
        is_active=db_user.is_active,
        scopes=list([p.codename for p in db_user.permissions]),
        groups=list([{"id": g.id, "name": g.name} for g in db_user.groups]),
    )

    model_user = usr_schema.UserDetails.model_validate(result)

    return model_user, None


def get_users(db_session: Session) -> list[usr_schema.User]:
    db_users = db_session.scalars(select(User))
    model_users = [usr_schema.User.model_validate(db_user) for db_user in db_users]

    return model_users


def create_user(
    db_session: Session,
    username: str,
    email: str,
    password: str,
    scopes: list[str] | None = None,
    group_ids: list[int] | None = None,
    is_superuser: bool = False,
    is_active: bool = False,
    user_id: uuid.UUID | None = None,
) -> Tuple[usr_schema.User | None, err_schema.Error | None]:
    if scopes is None:
        scopes = []

    if group_ids is None:
        group_ids = []

    _user_id = user_id or uuid.uuid4()
    home_folder_id = uuid.uuid4()
    inbox_folder_id = uuid.uuid4()

    db_user = User(
        id=_user_id,
        username=username,
        email=email,
        is_superuser=is_superuser,
        is_active=is_active,
        password=pbkdf2_sha256.hash(password),
    )
    db_inbox = nodes_orm.Folder(
        id=inbox_folder_id,
        title=constants.INBOX_TITLE,
        ctype=constants.CTYPE_FOLDER,
        user_id=_user_id,
        lang="xxx",  # not used
    )
    db_home = nodes_orm.Folder(
        id=home_folder_id,
        title=constants.HOME_TITLE,
        ctype=constants.CTYPE_FOLDER,
        user_id=_user_id,
        lang="xxx",  # not used
    )
    db_session.add(db_user)
    db_session.add(db_home)
    db_session.add(db_inbox)
    db_session.commit()
    db_user.home_folder_id = db_home.id
    db_user.inbox_folder_id = db_inbox.id
    # fetch permissions from the DB
    try:
        db_session.commit()

        stmt = select(group_orm.Permission).where(
            group_orm.Permission.codename.in_(scopes)
        )
        db_perms = db_session.execute(stmt).scalars().all()
        # fetch groups from the DB

        stmt = select(group_orm.Group).where(group_orm.Group.id.in_(group_ids))
        db_groups = db_session.execute(stmt).scalars().all()

        db_user.permissions = db_perms
        db_user.groups = db_groups
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    user = usr_schema.User.model_validate(db_user)

    return user, None


def update_user(
    db_session, user_id: uuid.UUID, attrs: usr_schema.UpdateUser
) -> Tuple[usr_schema.UserDetails | None, err_schema.Error | None]:
    stmt = select(group_orm.Permission).where(
        group_orm.Permission.codename.in_(attrs.scopes)
    )
    perms = db_session.execute(stmt).scalars().all()

    stmt = select(group_orm.Group).where(group_orm.Group.id.in_(attrs.group_ids))
    groups = db_session.execute(stmt).scalars().all()
    user = db_session.get(User, user_id)

    user.username = attrs.username
    user.email = attrs.email
    user.permissions = perms
    user.is_superuser = attrs.is_superuser
    user.is_active = attrs.is_active

    user.groups = groups
    if attrs.password:
        user.password = pbkdf2_sha256.hash(attrs.password)

    try:
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    result = usr_schema.UserDetails(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at,
        updated_at=user.updated_at,
        home_folder_id=user.home_folder_id,
        inbox_folder_id=user.inbox_folder_id,
        is_superuser=user.is_superuser,
        is_active=user.is_active,
        scopes=list([p.codename for p in user.permissions]),
        groups=list([{"id": g.id, "name": g.name} for g in groups]),
    )

    model_user = usr_schema.UserDetails.model_validate(result)

    return model_user, None


def get_user_scopes_from_groups(
    db_session: Session, user_id: uuid.UUID, groups: list[str]
) -> list[str]:
    db_user = db_session.get(User, user_id)

    if db_user is None:
        logger.debug(f"User with user_id {user_id} not found")
        return []

    db_groups = db_session.scalars(
        select(group_orm.Group).where(group_orm.Group.name.in_(groups))
    ).all()

    if db_user.is_superuser:
        # superuser has all permissions (permission = scope)
        result = scopes.SCOPES.keys()
    else:
        # user inherits his/her group associated permissions
        result = set()
        for group in db_groups:
            result.update([p.codename for p in group.permissions])

    return list(result)


def delete_user(
    db_session: Session, user_id: uuid.UUID | None = None, username: str | None = None
):
    if user_id is not None:
        stmt = select(User).where(User.id == user_id)
    elif username is not None:
        stmt = select(User).where(User.username == username)
    else:
        raise ValueError("Either username or user_id parameter must be provided")

    user = db_session.execute(stmt).scalars().one()
    db_session.delete(user)
    db_session.commit()
