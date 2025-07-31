import uuid
import math
import logging
from typing import Tuple

from passlib.hash import pbkdf2_sha256
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm, schema
from papermerge.core.utils.misc import is_valid_uuid
from papermerge.core.features.auth import scopes
from papermerge.core import constants
from papermerge.core.schemas import error as err_schema
from papermerge.core.features.groups.db.orm import user_groups_association
from .orm import User

DATETIME_FMT = "%Y-%m-%d %H:%M:%S.%f"

logger = logging.getLogger(__name__)


async def get_user(db_session: AsyncSession, user_id_or_username: str) -> schema.User:
    logger.debug(f"user_id_or_username={user_id_or_username}")

    if is_valid_uuid(user_id_or_username):
        stmt = select(User).where(User.id == uuid.UUID(user_id_or_username))
        params = {"id": user_id_or_username}
    else:
        stmt = select(User).where(User.username == user_id_or_username)
        params = {"username": user_id_or_username}

    db_user = (await db_session.scalars(stmt, params)).one()

    logger.debug(f"User {db_user} fetched")
    model_user = schema.User.model_validate(db_user)

    return model_user


async def get_user_group_homes(
    db_session: AsyncSession, user_id: uuid.UUID
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

    results = (await db_session.execute(stmt)).all()

    models = []
    for group_name, group_id, home_folder_id in results:
        home = schema.UserHome(
            group_name=group_name, group_id=group_id, home_id=home_folder_id
        )
        models.append(schema.UserHome.model_validate(home))

    return models, None


async def get_user_group_inboxes(
    db_session: AsyncSession, user_id: uuid.UUID
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

    results = (await db_session.execute(stmt)).all()

    models = []
    for group_name, group_id, inbox_folder_id in results:
        home = schema.UserInbox(
            group_name=group_name, group_id=group_id, inbox_id=inbox_folder_id
        )
        models.append(schema.UserInbox.model_validate(home))

    return models, None


async def get_user_details(
    db_session: AsyncSession, user_id: uuid.UUID
) -> Tuple[schema.UserDetails | None, err_schema.Error | None]:
    stmt = select(User).options(selectinload(User.roles).selectinload(orm.Role.permissions)).where(User.id == user_id)
    params = {"id": user_id}

    try:
        db_user = (await db_session.scalars(stmt, params)).one()
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


async def get_users(
    db_session: AsyncSession, *, page_size: int, page_number: int
) -> schema.PaginatedResponse[schema.User]:
    stmt_total_users = select(func.count(orm.User.id))
    total_users = (await db_session.execute(stmt_total_users)).scalar()

    offset = page_size * (page_number - 1)
    stmt = select(orm.User).limit(page_size).offset(offset)

    db_users = (await db_session.scalars(stmt)).all()
    items = [schema.User.model_validate(db_user) for db_user in db_users]

    total_pages = math.ceil(total_users / page_size)

    return schema.PaginatedResponse[schema.User](
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )


async def get_users_without_pagination(db_session: AsyncSession) -> list[schema.User]:
    stmt = select(orm.User).order_by(orm.User.username.asc())
    db_users = (await db_session.scalars(stmt)).all()

    items = [schema.User.model_validate(db_user) for db_user in db_users]

    return items

async def create_user(
    db_session: AsyncSession,
    username: str,
    email: str,
    password: str,
    scopes: list[str] | None = None,
    group_ids: list[int] | None = None,
    is_superuser: bool = False,
    is_active: bool = False,
    user_id: uuid.UUID | None = None,
) -> Tuple[schema.User | None, err_schema.Error | None]:
    scopes = scopes or []
    group_ids = group_ids or []
    _user_id = user_id or uuid.uuid4()

    try:
        user = orm.User(
            id=_user_id,
            username=username,
            email=email,
            password=pbkdf2_sha256.hash(password),
            is_superuser=is_superuser,
            is_active=is_active,
        )
        db_session.add(user)
        await db_session.flush()

        # Create folders first and flush to get valid IDs
        home = orm.Folder(
            title=constants.HOME_TITLE,
            ctype=constants.CTYPE_FOLDER,
            user_id=user.id,
            lang="xxx",
        )
        inbox = orm.Folder(
            id=uuid.uuid4(),
            title=constants.INBOX_TITLE,
            ctype=constants.CTYPE_FOLDER,
            user_id=user.id,
            lang="xxx",
        )
        db_session.add_all([home, inbox])
        await db_session.flush()  # inserts folders, IDs available now

        await db_session.commit()
        await db_session.refresh(user)

        return schema.User.model_validate(user), None

    except Exception as e:
        await db_session.rollback()
        return None, err_schema.Error(messages=[str(e)])


async def update_user(
    db_session: AsyncSession, user_id: uuid.UUID, attrs: schema.UpdateUser
) -> Tuple[schema.UserDetails | None, err_schema.Error | None]:
    groups = []
    roles = []
    scopes = set()
    stmt = select(orm.User).options(selectinload(orm.User.roles), selectinload(orm.User.groups)).where(orm.User.id == user_id)
    user = (await db_session.execute(stmt)).scalar()
    if attrs.username is not None:
        user.username = attrs.username

    if attrs.email is not None:
        user.email = attrs.email

    if attrs.is_superuser is not None:
        user.is_superuser = attrs.is_superuser

    if attrs.is_active is not None:
        user.is_active = attrs.is_active

    if attrs.group_ids is not None:
        stmt = select(orm.Group).where(orm.Group.id.in_(attrs.group_ids))
        groups = (await db_session.execute(stmt)).scalars().all()
        user.groups = groups

    if attrs.role_ids is not None:
        stmt = select(orm.Role).where(orm.Role.id.in_(attrs.role_ids))
        roles = (await db_session.execute(stmt)).scalars().all()
        user.roles = roles

    if attrs.password is not None:
        user.password = pbkdf2_sha256.hash(attrs.password)

    try:
        await db_session.commit()
    except Exception as e:
        await db_session.rollback()
        error = err_schema.Error(messages=[str(e)])
        return None, error

    for role in user.roles:
        for perm in role.permissions:
            scopes.add(perm.codename)

    await db_session.refresh(user)

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


async def get_user_scopes_from_roles(
    db_session: AsyncSession, user_id: uuid.UUID, roles: list[str]
) -> list[str]:
    db_user = await db_session.get(User, user_id)

    if db_user is None:
        logger.debug(f"User with user_id {user_id} not found")
        return []

    lowercase_roles = [role.lower() for role in roles]

    db_roles = (await db_session.scalars(
        select(orm.Role).where(func.lower(orm.Role.name).in_(lowercase_roles))
    )).all()

    if db_user.is_superuser:
        # superuser has all permissions (permission = scope)
        result = scopes.SCOPES.keys()
    else:
        # user inherits his/her group associated permissions
        result = set()
        for role in db_roles:
            result.update([p.codename for p in role.permissions])

    return list(result)


async def delete_user(
    db_session: AsyncSession,
    user_id: uuid.UUID | None = None,
    username: str | None = None,
):
    if user_id is not None:
        stmt = select(User).where(User.id == user_id)
    elif username is not None:
        stmt = select(User).where(User.username == username)
    else:
        raise ValueError("Either username or user_id parameter must be provided")

    user = (await db_session.execute(stmt)).scalars().one()
    await db_session.delete(user)
    await db_session.commit()


async def get_users_count(db_session: AsyncSession) -> int:
    stmt = select(func.count(orm.User.id))
    return (await db_session.execute(stmt)).scalar()


async def change_password(
    db_session: AsyncSession, user_id: uuid.UUID, password: str
) -> Tuple[schema.User | None, err_schema.Error | None]:
    stmt = select(orm.User).options(selectinload(orm.User.roles), selectinload(orm.User.groups)).where(
        orm.User.id == user_id)
    db_user = (await db_session.execute(stmt)).scalar()
    db_user.password = pbkdf2_sha256.hash(password)

    try:
        await db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    await db_session.refresh(db_user)
    user = schema.User.model_validate(db_user)

    return user, None


async def user_belongs_to(
    db_session: AsyncSession, group_id: uuid.UUID, user_id: uuid.UUID
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
    result = (await db_session.execute(stmt)).scalar()
    return result > 0
