import uuid
import math
import logging
from typing import Tuple, Optional, Dict, Any

from passlib.hash import pbkdf2_sha256
from sqlalchemy import select, func, text, and_, or_
from sqlalchemy.orm import selectinload, aliased
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound

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
    db_session: AsyncSession,
    user_id: uuid.UUID
) -> Tuple[schema.UserDetails | None, err_schema.Error | None]:
    created_by_user = aliased(orm.User)
    updated_by_user = aliased(orm.User)

    stmt = select(
        orm.User,
        created_by_user.id.label('created_by_id'),
        created_by_user.username.label('created_by_username'),
        updated_by_user.id.label('updated_by_id'),
        updated_by_user.username.label('updated_by_username')
    ).options(
        selectinload(orm.User.user_roles)
        .selectinload(orm.UserRole.role)
        .selectinload(orm.Role.permissions),
        selectinload(orm.User.groups)
    ).outerjoin(
        created_by_user, orm.User.created_by == created_by_user.id
    ).outerjoin(
        updated_by_user, orm.User.updated_by == updated_by_user.id
    ).where(orm.User.id == user_id)

    try:
        result = await db_session.execute(stmt)
        row = result.one()
        db_user = row[0]  # The User object is the first element

        # Extract the joined data
        created_by_id = row.created_by_id
        created_by_username = row.created_by_username
        updated_by_id = row.updated_by_id
        updated_by_username = row.updated_by_username

    except NoResultFound:
        error = err_schema.Error(messages=[f"User with ID {user_id} not found"])
        return None, error
    except Exception as e:
        error = err_schema.Error(messages=[f"Database error: {str(e)}"])
        return None, error

    scopes = set()
    active_roles = []

    for user_role in db_user.user_roles:
        if user_role.deleted_at is None:
            active_roles.append(user_role.role)
            for perm in user_role.role.permissions:
                scopes.add(perm.codename)

    # Build created_by info
    created_by = None
    if created_by_id:
        created_by = schema.ByUser(
            id=created_by_id,
            username=created_by_username
        )

    # Build updated_by info
    updated_by = None
    if updated_by_id:
        updated_by = schema.ByUser(
            id=updated_by_id,
            username=updated_by_username
        )

    # Create the result object
    user_details = schema.UserDetails(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        home_folder_id=db_user.home_folder_id,
        inbox_folder_id=db_user.inbox_folder_id,
        is_superuser=db_user.is_superuser,
        is_active=db_user.is_active,
        scopes=sorted(scopes),
        groups=db_user.groups,
        roles=active_roles,
        created_at=db_user.created_at,
        created_by=created_by,
        updated_at=db_user.updated_at,
        updated_by=updated_by
    )

    return user_details, None


async def get_users(
    db_session: AsyncSession,
    *,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filters: Optional[Dict[str, Dict[str, Any]]] = None,
    include_deleted: bool = False,
    include_archived: bool = True
) -> schema.PaginatedResponse[schema.UserEx]:
    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    deleted_user = aliased(orm.User, name='deleted_user')
    archived_user = aliased(orm.User, name='archived_user')

    # Build base query with joins for all audit user data
    base_query = (
        select(orm.User)
        .join(created_user, orm.User.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.User.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.User.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.User.archived_by == archived_user.id, isouter=True)
    )

    where_conditions = []

    if not include_deleted:
        where_conditions.append(orm.User.deleted_at.is_(None))

    if not include_archived:
        where_conditions.append(orm.User.archived_at.is_(None))

    if filters:
        filter_conditions = _build_filter_conditions(
            filters, created_user, updated_user, deleted_user, archived_user
        )
        where_conditions.extend(filter_conditions)

    if where_conditions:
        base_query = base_query.where(and_(*where_conditions))

    # Count total items (using the same filters)
    count_query = (
        select(func.count(orm.User.id))
        .join(created_user, orm.User.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.User.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.User.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.User.archived_by == archived_user.id, isouter=True)
    )

    if where_conditions:
        count_query = count_query.where(and_(*where_conditions))

    total_users = (await db_session.execute(count_query)).scalar()

    if sort_by and sort_direction:
        base_query = _apply_sorting(
            base_query, sort_by, sort_direction,
            created_user=created_user,
            updated_user=updated_user,
            deleted_user=deleted_user,
            archived_user=archived_user
        )
    else:
        # Default sorting by created_at desc
        base_query = base_query.order_by(orm.User.created_at.desc())

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Modify query to include all audit user data
    paginated_query_with_users = (
        base_query
        .add_columns(
            # Created by user
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            # Updated by user
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username'),
            # Deleted by user
            deleted_user.id.label('deleted_by_id'),
            deleted_user.username.label('deleted_by_username'),
            # Archived by user
            archived_user.id.label('archived_by_id'),
            archived_user.username.label('archived_by_username')
        )
        .limit(page_size)
        .offset(offset)
    )
    # Execute query - get tuples with role and user data
    results = (await db_session.execute(paginated_query_with_users)).all()

    # Convert to schema models with complete audit trail
    items = []
    for row in results:
        user = row[0]  # The Role object

        # Build audit user objects (handle None values)
        created_by = None
        if row.created_by_id:
            created_by = schema.ByUser(
                id=row.created_by_id,
                username=row.created_by_username
            )

        updated_by = None
        if row.updated_by_id:
            updated_by = schema.ByUser(
                id=row.updated_by_id,
                username=row.updated_by_username
            )

        deleted_by = None
        if row.deleted_by_id:
            deleted_by = schema.ByUser(
                id=row.deleted_by_id,
                username=row.deleted_by_username
            )

        archived_by = None
        if row.archived_by_id:
            archived_by = schema.ByUser(
                id=row.archived_by_id,
                username=row.archived_by_username
            )

        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "home_folder_id": user.home_folder_id,
            "inbox_folder_id": user.inbox_folder_id,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "deleted_at": user.deleted_at,
            "archived_at": user.archived_at,
            "created_by": created_by,
            "updated_by": updated_by,
            "deleted_by": deleted_by,
            "archived_by": archived_by
        }

        items.append(schema.UserEx(**user_data))

    total_pages = math.ceil(total_users / page_size) if total_users > 0 else 1

    return schema.PaginatedResponse[schema.UserEx](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages,
        total_items=total_users
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
    role_ids: list[uuid.UUID] | None = None,
    group_ids: list[uuid.UUID] | None = None,
    is_superuser: bool = False,
    is_active: bool = False,
    user_id: uuid.UUID | None = None,
) -> Tuple[schema.User | None, err_schema.Error | None]:
    group_ids = group_ids or []
    role_ids = role_ids or []
    _user_id = user_id or uuid.uuid4()  # Fixed variable name
    await db_session.execute(text("SET CONSTRAINTS ALL DEFERRED"))
    try:
        home_folder_id = uuid.uuid4()
        inbox_folder_id = uuid.uuid4()

        home = orm.Folder(
            id=home_folder_id,
            title=constants.HOME_TITLE,
            ctype=constants.CTYPE_FOLDER,
            user_id=_user_id,
            lang="xxx",
        )
        inbox = orm.Folder(
            id=inbox_folder_id,
            title=constants.INBOX_TITLE,
            ctype=constants.CTYPE_FOLDER,
            user_id=_user_id,
            lang="xxx",
        )

        # Associate groups if provided
        groups = []
        if group_ids:
            # Fetch active groups by IDs
            groups_result = await db_session.execute(
                select(orm.Group).where(
                    orm.Group.id.in_(group_ids),
                    orm.Group.deleted_at.is_(None)  # Only fetch active groups
                )
            )
            groups = list(groups_result.scalars().all())

            # Check if all requested groups were found
            found_group_ids = {group.id for group in groups}
            missing_group_ids = set(group_ids) - found_group_ids
            if missing_group_ids:
                raise ValueError(f"Groups not found or inactive: {missing_group_ids}")

        # Associate roles if provided
        roles = []
        if role_ids:
            # Fetch active roles by IDs
            roles_result = await db_session.execute(
                select(orm.Role).where(
                    orm.Role.id.in_(role_ids),
                    orm.Role.deleted_at.is_(None)  # Only fetch active roles
                )
            )
            roles = list(roles_result.scalars().all())

            # Check if all requested roles were found
            found_role_ids = {role.id for role in roles}
            missing_role_ids = set(role_ids) - found_role_ids
            if missing_role_ids:
                raise ValueError(f"Roles not found or inactive: {missing_role_ids}")

        user = orm.User(
            id=_user_id,
            username=username,
            email=email,
            password=pbkdf2_sha256.hash(password),
            is_superuser=is_superuser,
            is_active=is_active,
            home_folder_id=home_folder_id,
            inbox_folder_id=inbox_folder_id,
        )

        # Set group relationships before adding to session
        if groups:
            user.groups = groups

        # Create UserRole associations for roles (fixed the main issue)
        user_roles = []
        if roles:
            for role in roles:
                user_role = orm.UserRole(
                    user_id=_user_id,
                    role_id=role.id
                )
                user_roles.append(user_role)

        # Add all objects to session
        db_session.add_all([user, home, inbox] + user_roles)
        await db_session.flush()
        await db_session.commit()
        await db_session.refresh(user)
        return schema.User.model_validate(user), None

    except Exception as e:
        await db_session.rollback()
        return None, err_schema.Error(messages=[str(e)])


async def update_user(
        db_session: AsyncSession, user_id: uuid.UUID, attrs: schema.UpdateUser
) -> Tuple[schema.UserDetails | None, err_schema.Error | None]:

    # Load user with proper relationship loading
    stmt = select(orm.User).options(
        selectinload(orm.User.user_roles)
        .selectinload(orm.UserRole.role)
        .selectinload(orm.Role.permissions),
        selectinload(orm.User.groups)
    ).where(orm.User.id == user_id)

    try:
        user = (await db_session.execute(stmt)).scalar_one()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    # Update basic user attributes
    if attrs.username is not None:
        user.username = attrs.username

    if attrs.email is not None:
        user.email = attrs.email

    if attrs.is_superuser is not None:
        user.is_superuser = attrs.is_superuser

    if attrs.is_active is not None:
        user.is_active = attrs.is_active

    if attrs.password is not None:
        user.password = pbkdf2_sha256.hash(attrs.password)

    # Update groups (this works as before since groups don't use soft delete)
    if attrs.group_ids is not None:
        stmt = select(orm.Group).where(orm.Group.id.in_(attrs.group_ids))
        groups = list((await db_session.execute(stmt)).scalars().all())
        user.groups = groups

    # Update roles - Handle soft delete properly
    if attrs.role_ids is not None:
        # Soft delete existing user_roles by setting deleted_at
        for existing_user_role in user.user_roles:
            if existing_user_role.deleted_at is None:  # Only mark active ones as deleted
                existing_user_role.deleted_at = func.now()

        # Create new UserRole entries for the new roles
        if attrs.role_ids:  # Only if there are new roles to add
            stmt = select(orm.Role).where(orm.Role.id.in_(attrs.role_ids))
            new_roles = list((await db_session.execute(stmt)).scalars().all())

            for role in new_roles:
                new_user_role = orm.UserRole(user=user, role=role)
                db_session.add(new_user_role)

    try:
        await db_session.commit()
    except Exception as e:
        await db_session.rollback()
        error = err_schema.Error(messages=[str(e)])
        return None, error

    # Reload user with fresh data to get the updated relationships
    stmt = select(orm.User).options(
        selectinload(orm.User.user_roles)
        .selectinload(orm.UserRole.role)
        .selectinload(orm.Role.permissions),
        selectinload(orm.User.groups)
    ).where(orm.User.id == user_id)

    user = (await db_session.execute(stmt)).scalar_one()

    # Collect scopes from active roles only
    scopes = set()
    active_roles = []

    for user_role in user.user_roles:
        if user_role.deleted_at is None:  # Only active roles
            active_roles.append(user_role.role)
            for perm in user_role.role.permissions:
                scopes.add(perm.codename)

    # Create the response
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
        groups=user.groups,
        roles=active_roles,
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
        select(orm.Role).options(
            selectinload(orm.Role.permissions)
        ).where(func.lower(orm.Role.name).in_(lowercase_roles))
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
    stmt = select(orm.User).options(selectinload(orm.User.user_roles), selectinload(orm.User.groups)).where(
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


def _build_filter_conditions(
    filters: Dict[str, Dict[str, Any]],
    created_user,
    updated_user,
    deleted_user,
    archived_user
) -> list:
    """Build SQLAlchemy WHERE conditions from filters dictionary."""
    conditions = []

    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")

        if not value:
            continue

        condition = None

        if filter_name == "free_text":
            search_term = f"%{value}%"

            condition = or_(
                orm.User.username.ilike(search_term),
                orm.User.email.ilike(search_term),
                created_user.username.ilike(search_term),
                updated_user.username.ilike(search_term),
                created_user.first_name.ilike(search_term),
                created_user.last_name.ilike(search_term),
                updated_user.first_name.ilike(search_term),
                updated_user.last_name.ilike(search_term),
            )

        if condition is not None:
            conditions.append(condition)

    return conditions


def _apply_sorting(
    query,
    sort_by: str,
    sort_direction: str,
    created_user,
    updated_user,
    deleted_user,
    archived_user,
):
    sort_column = None

    if sort_by == "id":
        sort_column = orm.User.id
    elif sort_by == "username":
        sort_column = orm.User.username
    elif sort_by == "email":
        sort_column = orm.User.email
    elif sort_by == "created_at":
        sort_column = orm.Role.created_at
    elif sort_by == "updated_at":
        sort_column = orm.Role.updated_at
    elif sort_by == "created_by":
        sort_column = created_user.username
    elif sort_by == "updated_by":
        sort_column = updated_user.username
    elif sort_by == "deleted_by":
        sort_column = deleted_user.username
    elif sort_by == "archived_by":
        sort_column = archived_user.username

    if sort_column is not None:
        if sort_direction.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    return query
