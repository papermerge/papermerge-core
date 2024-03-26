import logging
import uuid
from uuid import UUID

from passlib.hash import pbkdf2_sha256
from sqlalchemy import Engine, select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from papermerge.core import constants, schemas
from papermerge.core.auth import scopes
from papermerge.core.db.models import Folder, Group, Permission, User
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


def get_user_details(
    engine: Engine,
    user_id: UUID
) -> schemas.UserDetails:

    stmt = select(User).where(User.id == user_id)
    params = {"id": user_id}

    with Session(engine) as session:
        db_user = session.scalars(stmt, params).one()

        result = schemas.UserDetails(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            created_at=db_user.created_at,
            updated_at=db_user.updated_at,
            home_folder_id=db_user.home_folder_id,
            inbox_folder_id=db_user.inbox_folder_id,
            is_superuser=db_user.is_superuser,
            is_active=db_user.is_active,
            scopes=list([
                p.codename for p in db_user.permissions
            ]),
            groups=list([
                {'id': g.id, 'name': g.name} for g in db_user.groups
            ]),
        )

        model_user = schemas.UserDetails.model_validate(result)

    return model_user


def get_users(
    engine: Engine
) -> list[schemas.User]:
    with Session(engine) as session:
        db_users = session.scalars(select(User))
        model_users = [
            schemas.User.model_validate(db_user)
            for db_user in db_users
        ]

    return model_users


def create_user(
    engine: Engine,
    username: str,
    email: str,
    password: str,
    scopes: list[str] | None = None,
    group_ids: list[int] | None = None,
    is_superuser: bool = False,
    is_active: bool = False,
    user_id: UUID | None = None
) -> schemas.User:

    if scopes is None:
        scopes = []

    if group_ids is None:
        group_ids = []

    with Session(engine) as session:
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
        db_inbox = Folder(
            id=inbox_folder_id,
            title=constants.INBOX_TITLE,
            ctype=constants.CTYPE_FOLDER,
            user_id=_user_id,
            lang='xxx'  # not used
        )
        db_home = Folder(
            id=home_folder_id,
            title=constants.HOME_TITLE,
            ctype=constants.CTYPE_FOLDER,
            user_id=_user_id,
            lang='xxx'  # not used
        )
        session.add(db_user)
        session.add(db_home)
        session.add(db_inbox)
        session.commit()

        db_user.home_folder_id = db_home.id
        db_user.inbox_folder_id = db_inbox.id
        # fetch permissions from the DB
        stmt = select(Permission).where(
            Permission.codename.in_(scopes)
        )
        db_perms = session.execute(stmt).scalars().all()
        # fetch groups from the DB
        stmt = select(Group).where(
            Group.id.in_(group_ids)
        )
        db_groups = session.execute(stmt).scalars().all()
        db_user.permissions = db_perms
        db_user.groups = db_groups
        session.commit()

        user = schemas.User.model_validate(db_user)

    return user


def update_user(
    engine: Engine,
    user_id: UUID,
    attrs: schemas.UpdateUser
) -> schemas.UserDetails:
    with Session(engine) as session:
        stmt = select(Permission).where(
            Permission.codename.in_(attrs.scopes)
        )
        perms = session.execute(stmt).scalars().all()

        stmt = select(Group).where(
            Group.id.in_(attrs.group_ids)
        )
        groups = session.execute(stmt).scalars().all()
        user = session.get(User, user_id)

        user.username = attrs.username
        user.email = attrs.email
        user.permissions = perms
        user.is_superuser = attrs.is_superuser
        user.is_active = attrs.is_active

        user.groups = groups
        if attrs.password:
            user.password = pbkdf2_sha256.hash(attrs.password)

        session.commit()
        result = schemas.UserDetails(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at,
            home_folder_id=user.home_folder_id,
            inbox_folder_id=user.inbox_folder_id,
            is_superuser=user.is_superuser,
            is_active=user.is_active,
            scopes=list([
                p.codename for p in user.permissions
            ]),
            groups=list([
                {'id': g.id, 'name': g.name} for g in groups
            ]),
        )

        model_user = schemas.UserDetails.model_validate(result)

    return model_user


def get_user_scopes_from_groups(
    engine: Engine,
    user_id: UUID,
    groups: list[str]
) -> list[str]:
    with Session(engine) as session:
        db_user = session.get(User, user_id)

        if db_user is None:
            return []

        db_groups = session.scalars(
            select(Group).where(Group.name.in_(groups))
        ).all()

        if db_user.is_superuser:
            # superuser has all permissions (permission = scope)
            result = scopes.SCOPES.keys()
        else:
            # user inherits his/her group associated permissions
            result = set()
            for group in db_groups:
                result.update(
                    [p.codename for p in group.permissions]
                )

    return list(result)
