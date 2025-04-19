import uuid
import math
import logging
from typing import Tuple

from passlib.hash import pbkdf2_sha256
from sqlalchemy import select, func

from papermerge.core import db, orm, schema
from papermerge.core.utils.misc import is_valid_uuid
from papermerge.core.features.auth import scopes
from papermerge.core import constants
from papermerge.core.schemas import error as err_schema
from papermerge.core.features.groups.db.orm import user_groups_association

from .orm import User

DATETIME_FMT = "%Y-%m-%d %H:%M:%S.%f"

logger = logging.getLogger(__name__)


def get_user(db_session: db.Session, user_id_or_username: str) -> schema.User:
    logger.debug(f"user_id_or_username={user_id_or_username}")

    if is_valid_uuid(user_id_or_username):
        stmt = select(User).where(User.id == uuid.UUID(user_id_or_username))
        params = {"id": user_id_or_username}
    else:
        stmt = select(User).where(User.username == user_id_or_username)
        params = {"username": user_id_or_username}

    db_user = db_session.scalars(stmt, params).one()

    logger.debug(f"User {db_user} fetched")
    model_user = schema.User.model_validate(db_user)

    return model_user


def get_user_group_homes(
    db_session: db.Session, user_id: uuid.UUID
) -> Tuple[list[schema.UserHome] | None, str | None]:
    """Gets user group homes

    SELECT g.name, g.home_folder_id
    FROM groups g
    JOIN users_groups ug ON ug.group_id = g.id
    WHERE ug.user_id = <user_id>
    """
    stmt = (
        select(
            orm.Group.name, orm.Group.id, orm.Group.home_folder_id
        )  # Selecting only `Group.name` (since `home_folder_id` isn't defined in Group)
        .join(
            user_groups_association, user_groups_association.c.group_id == orm.Group.id
        )
        .where(
            user_groups_association.c.user_id == user_id,
            orm.Group.home_folder_id != None,
        )
    )

    results = db_session.execute(stmt).all()

    models = []
    for group_name, group_id, home_folder_id in results:
        home = schema.UserHome(
            group_name=group_name, group_id=group_id, home_id=home_folder_id
        )
        models.append(schema.UserHome.model_validate(home))

    return models, None


def get_user_group_inboxes(
    db_session: db.Session, user_id: uuid.UUID
) -> Tuple[list[schema.UserHome] | None, str | None]:
    """Gets user group inboxes

    SELECT g.name, g.inbox_folder_id
    FROM groups g
    JOIN users_groups ug ON ug.group_id = g.id
    WHERE ug.user_id = <user_id>
    """
    stmt = (
        select(orm.Group.name, orm.Group.id, orm.Group.inbox_folder_id)
        .join(
            user_groups_association, user_groups_association.c.group_id == orm.Group.id
        )
        .where(
            user_groups_association.c.user_id == user_id,
            orm.Group.inbox_folder_id != None,
        )
    )

    results = db_session.execute(stmt).all()

    models = []
    for group_name, group_id, inbox_folder_id in results:
        home = schema.UserInbox(
            group_name=group_name, group_id=group_id, inbox_id=inbox_folder_id
        )
        models.append(schema.UserInbox.model_validate(home))

    return models, None


def get_user_details(
    db_session, user_id: uuid.UUID
) -> Tuple[schema.UserDetails | None, err_schema.Error | None]:
    stmt = select(User).where(User.id == user_id)
    params = {"id": user_id}

    try:
        db_user = db_session.scalars(stmt, params).one()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    scopes = set()
    for role in db_user.roles:
        for perm in role.permissions:
            scopes.add(perm.codename)

    result = schema.UserDetails(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        created_at=db_user.created_at,
        updated_at=db_user.updated_at,
        home_folder_id=db_user.home_folder_id,
        inbox_folder_id=db_user.inbox_folder_id,
        is_superuser=db_user.is_superuser,
        is_active=db_user.is_active,
        scopes=sorted(scopes),
        groups=db_user.groups,
        roles=db_user.roles,
    )

    model_user = schema.UserDetails.model_validate(result)

    return model_user, None


def get_users(
    db_session: db.Session, *, page_size: int, page_number: int
) -> schema.PaginatedResponse[schema.User]:
    stmt_total_users = select(func.count(orm.User.id))
    total_users = db_session.execute(stmt_total_users).scalar()

    offset = page_size * (page_number - 1)
    stmt = select(orm.User).limit(page_size).offset(offset)

    db_users = db_session.scalars(stmt).all()
    items = [schema.User.model_validate(db_user) for db_user in db_users]

    total_pages = math.ceil(total_users / page_size)

    return schema.PaginatedResponse[schema.User](
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )


def get_users_without_pagination(db_session: db.Session) -> list[schema.User]:
    stmt = select(orm.User).order_by(orm.User.username.asc())
    db_users = db_session.scalars(stmt).all()

    items = [schema.User.model_validate(db_user) for db_user in db_users]

    return items


def create_user(
    db_session: db.Session,
    username: str,
    email: str,
    password: str,
    scopes: list[str] | None = None,
    group_ids: list[int] | None = None,
    is_superuser: bool = False,
    is_active: bool = False,
    user_id: uuid.UUID | None = None,
) -> Tuple[schema.User | None, err_schema.Error | None]:
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
    db_inbox = orm.Folder(
        id=inbox_folder_id,
        title=constants.INBOX_TITLE,
        ctype=constants.CTYPE_FOLDER,
        user_id=_user_id,
        lang="xxx",  # not used
    )
    db_home = orm.Folder(
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

        stmt = select(orm.Permission).where(orm.Permission.codename.in_(scopes))
        db_perms = db_session.execute(stmt).scalars().all()
        # fetch groups from the DB

        stmt = select(orm.Group).where(orm.Group.id.in_(group_ids))
        db_groups = db_session.execute(stmt).scalars().all()

        db_user.permissions = db_perms
        db_user.groups = db_groups
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    user = schema.User.model_validate(db_user)

    return user, None


def update_user(
    db_session, user_id: uuid.UUID, attrs: schema.UpdateUser
) -> Tuple[schema.UserDetails | None, err_schema.Error | None]:
    groups = []
    roles = []
    scopes = set()
    user = db_session.get(User, user_id)

    if attrs.username is not None:
        user.username = attrs.username

    if attrs.email is not None:
        user.email = attrs.email

    if attrs.scopes is not None:
        stmt = select(orm.Permission).where(orm.Permission.codename.in_(attrs.scopes))
        perms = db_session.execute(stmt).scalars().all()
        user.permissions = perms

    if attrs.is_superuser is not None:
        user.is_superuser = attrs.is_superuser

    if attrs.is_active is not None:
        user.is_active = attrs.is_active

    if attrs.group_ids is not None:
        stmt = select(orm.Group).where(orm.Group.id.in_(attrs.group_ids))
        groups = db_session.execute(stmt).scalars().all()
        user.groups = groups

    if attrs.role_ids is not None:
        stmt = select(orm.Role).where(orm.Role.id.in_(attrs.role_ids))
        roles = db_session.execute(stmt).scalars().all()
        user.roles = roles

    if attrs.password is not None:
        user.password = pbkdf2_sha256.hash(attrs.password)

    try:
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    for role in user.roles:
        for perm in role.permissions:
            scopes.add(perm.codename)

    result = schema.UserDetails(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at,
        updated_at=user.updated_at,
        home_folder_id=user.home_folder_id,
        inbox_folder_id=user.inbox_folder_id,
        is_superuser=user.is_superuser,
        is_active=user.is_active,
        scopes=sorted(scopes),
        groups=groups,
        roles=roles,
    )

    model_user = schema.UserDetails.model_validate(result)

    return model_user, None


def get_user_scopes_from_roles(
    db_session: db.Session, user_id: uuid.UUID, roles: list[str]
) -> list[str]:
    db_user = db_session.get(User, user_id)

    if db_user is None:
        logger.debug(f"User with user_id {user_id} not found")
        return []

    lowercase_roles = [role.lower() for role in roles]

    db_roles = db_session.scalars(
        select(orm.Role).where(func.lower(orm.Role.name).in_(lowercase_roles))
    ).all()
    print(f"{db_roles=} {roles=}")
    if db_user.is_superuser:
        # superuser has all permissions (permission = scope)
        result = scopes.SCOPES.keys()
    else:
        # user inherits his/her group associated permissions
        result = set()
        for role in db_roles:
            result.update([p.codename for p in role.permissions])

    return list(result)


def delete_user(
    db_session: db.Session,
    user_id: uuid.UUID | None = None,
    username: str | None = None,
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


def get_users_count(db_session: db.Session) -> int:
    stmt = select(func.count(orm.User.id))
    return db_session.execute(stmt).scalar()


def change_password(
    db_session: db.Session, user_id: uuid.UUID, password: str
) -> Tuple[schema.User | None, err_schema.Error | None]:
    db_user = db_session.get(User, user_id)

    db_user.password = pbkdf2_sha256.hash(password)

    try:
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    user = schema.User.model_validate(db_user)

    return user, None


def user_belongs_to(
    db_session: db.Session, group_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    """Does user belong to group?"""
    stmt = (
        select(func.count())
        .select_from(user_groups_association)
        .where(
            user_groups_association.c.user_id == user_id,
            user_groups_association.c.group_id == group_id,
        )
    )
    result = db_session.execute(stmt).scalar()
    return result > 0
