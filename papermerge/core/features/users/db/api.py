import uuid
import math
import logging
from typing import Tuple, Optional, Dict, Any

from passlib.hash import pbkdf2_sha256
from sqlalchemy import select, func, and_, or_, update
from sqlalchemy.orm import selectinload, aliased
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound

from papermerge.core.utils.tz import utc_now
from papermerge.core import orm, schema, const
from papermerge.core.utils.misc import is_valid_uuid
from papermerge.core.features.auth import scopes
from papermerge.core.schemas import error as err_schema
from papermerge.core.features.preferences.db import api as prefs_dbapi
from papermerge.core.features.special_folders.db import \
    api as special_folders_api
from papermerge.core.features.special_folders.db.orm import SpecialFolder
from papermerge.core.types import OwnerType, FolderType
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

    # Get merged preferences as Pydantic model
    preferences_model = await prefs_dbapi.get_merged_preferences_as_model(
        db_session,
        db_user.id
    )

    # Convert ORM model to Pydantic schema
    model_user = schema.User.model_validate(db_user)

    # Add preferences to the user object
    model_user.preferences = preferences_model

    return model_user


async def get_user_groups(
    db_session: AsyncSession, user_id: uuid.UUID
) -> list[orm.Group]:
    """
    Gets user groups (i.e. groups user belongs to)
    """
    stmt = (
        select(orm.Group)
        .join(orm.UserGroup, orm.UserGroup.group_id == orm.Group.id)
        .where(
            orm.UserGroup.user_id == user_id,
            orm.UserGroup.deleted_at.is_(None),
            orm.Group.deleted_at.is_(None)
        )
    )

    results = await db_session.execute(stmt)

    return results.scalars().all()


async def get_user_group_homes(
    db_session: AsyncSession, user_id: uuid.UUID
) -> Tuple[list[schema.UserHome] | None, str | None]:
    """
    Gets user group homes by joining through special_folders table.

    SELECT g.name, g.id, sf.folder_id
    FROM groups g
    JOIN users_groups ug ON ug.group_id = g.id
    JOIN special_folders sf ON sf.owner_id = g.id
        AND sf.owner_type = 'group'
        AND sf.folder_type = 'home'
    WHERE ug.user_id = <user_id>
    AND ug.deleted_at IS NULL
    AND g.deleted_at IS NULL
    """
    stmt = (
        select(orm.Group.name, orm.Group.id, SpecialFolder.folder_id)
        .join(orm.UserGroup, orm.UserGroup.group_id == orm.Group.id)
        .join(
            SpecialFolder,
            and_(
                SpecialFolder.owner_id == orm.Group.id,
                SpecialFolder.owner_type == OwnerType.GROUP,
                SpecialFolder.folder_type == FolderType.HOME
            )
        )
        .where(
            orm.UserGroup.user_id == user_id,
            orm.UserGroup.deleted_at.is_(None),
            orm.Group.deleted_at.is_(None)
        )
    )

    results = (await db_session.execute(stmt)).all()

    models = []
    for group_name, group_id, home_folder_id in results:
        home = schema.UserHome(
            group_name=group_name,
            group_id=group_id,
            home_id=home_folder_id
        )
        models.append(home)

    return models, None


# Update get_user_group_inboxes function:
async def get_user_group_inboxes(
    db_session: AsyncSession, user_id: uuid.UUID
) -> Tuple[list[schema.UserInbox] | None, str | None]:
    """
    Gets user group inboxes by joining through special_folders table.

    SELECT g.name, g.id, sf.folder_id
    FROM groups g
    JOIN users_groups ug ON ug.group_id = g.id
    JOIN special_folders sf ON sf.owner_id = g.id
        AND sf.owner_type = 'group'
        AND sf.folder_type = 'inbox'
    WHERE ug.user_id = <user_id>
    AND ug.deleted_at IS NULL
    AND g.deleted_at IS NULL
    """
    stmt = (
        select(orm.Group.name, orm.Group.id, SpecialFolder.folder_id)
        .join(orm.UserGroup, orm.UserGroup.group_id == orm.Group.id)
        .join(
            SpecialFolder,
            and_(
                SpecialFolder.owner_id == orm.Group.id,
                SpecialFolder.owner_type == OwnerType.GROUP,
                SpecialFolder.folder_type == FolderType.INBOX
            )
        )
        .where(
            orm.UserGroup.user_id == user_id,
            orm.UserGroup.deleted_at.is_(None),
            orm.Group.deleted_at.is_(None)
        )
    )

    results = (await db_session.execute(stmt)).all()

    models = []
    for group_name, group_id, inbox_folder_id in results:
        inbox = schema.UserInbox(
            group_name=group_name,
            group_id=group_id,
            inbox_id=inbox_folder_id
        )
        models.append(inbox)

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
        selectinload(orm.User.user_groups)
        .selectinload(orm.UserGroup.group)

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

    active_groups = []

    for user_group in db_user.user_groups:
        if user_group.deleted_at is None:
            active_groups.append(user_group.group)

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
        groups=active_groups,
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

    # Apply role/group/scope filters to count query as well
    if filters:
        # Check if we need to join with role/group/permission tables for filtering
        needs_role_joins = any(filter_name in ['with_roles', 'without_roles', 'with_scopes', 'without_scopes']
                               for filter_name in filters.keys())
        needs_group_joins = any(filter_name in ['with_groups', 'without_groups']
                                for filter_name in filters.keys())

        if needs_role_joins:
            count_query = (
                count_query
                .join(orm.UserRole, orm.User.id == orm.UserRole.user_id, isouter=True)
                .join(orm.Role, orm.UserRole.role_id == orm.Role.id, isouter=True)
                .join(orm.roles_permissions_association, orm.Role.id == orm.roles_permissions_association.c.role_id, isouter=True)
                .join(orm.Permission, orm.roles_permissions_association.c.permission_id == orm.Permission.id, isouter=True)
            )

        if needs_group_joins:
            count_query = (
                count_query
                .join(orm.UserGroup, orm.User.id == orm.UserGroup.user_id, isouter=True)
                .join(orm.Group, orm.UserGroup.group_id == orm.Group.id, isouter=True)
            )

    if where_conditions:
        count_query = count_query.where(and_(*where_conditions))

    total_users = (await db_session.execute(count_query)).scalar()

    # Apply role/group/scope joins to main query if needed
    if filters:
        needs_role_joins = any(filter_name in ['with_roles', 'without_roles', 'with_scopes', 'without_scopes']
                               for filter_name in filters.keys())
        needs_group_joins = any(filter_name in ['with_groups', 'without_groups']
                                for filter_name in filters.keys())

        if needs_role_joins:
            base_query = (
                base_query
                .join(orm.UserRole, orm.User.id == orm.UserRole.user_id, isouter=True)
                .join(orm.Role, orm.UserRole.role_id == orm.Role.id, isouter=True)
                .join(orm.roles_permissions_association, orm.Role.id == orm.roles_permissions_association.c.role_id, isouter=True)
                .join(orm.Permission, orm.roles_permissions_association.c.permission_id == orm.Permission.id, isouter=True)
            )

        if needs_group_joins:
            base_query = (
                base_query
                .join(orm.UserGroup, orm.User.id == orm.UserGroup.user_id, isouter=True)
                .join(orm.Group, orm.UserGroup.group_id == orm.Group.id, isouter=True)
            )

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
        .distinct()  # Add distinct to handle multiple role/group joins
        .limit(page_size)
        .offset(offset)
    )

    # Execute query - get tuples with role and user data
    results = (await db_session.execute(paginated_query_with_users)).all()

    # Convert to schema models with complete audit trail
    items = []
    for row in results:
        user = row[0]  # The User object

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
    created_by: uuid.UUID = const.SYSTEM_USER_ID
) ->  orm.User:
    """
    Create a new user with special folders.

    REMOVED: No longer requires SET CONSTRAINTS ALL DEFERRED
    The circular dependency has been eliminated!
    """

    group_ids = group_ids or []
    role_ids = role_ids or []
    _user_id = user_id or uuid.uuid4()

    user = orm.User(
        id=_user_id,
        username=username,
        email=email,
        password=password,
        is_superuser=is_superuser,
        is_active=is_active,
        created_by=created_by,
        updated_by=created_by,
    )
    db_session.add(user)
    await db_session.flush()

    await special_folders_api.create_special_folders_for_user(
        db_session,
        _user_id
    )

    if group_ids:
        groups_result = await db_session.execute(
            select(orm.Group).where(
                orm.Group.id.in_(group_ids),
                orm.Group.deleted_at.is_(None)
            )
        )
        groups = list(groups_result.scalars().all())
        found_group_ids = {group.id for group in groups}
        missing_group_ids = set(group_ids) - found_group_ids
        if missing_group_ids:
            raise ValueError(f"Groups not found or inactive: {missing_group_ids}")

        for group in groups:
            user_group = orm.UserGroup(
                user_id=user.id,
                group_id=group.id,
                created_by=created_by,
                updated_by=created_by,
            )
            db_session.add(user_group)

    if role_ids:
        roles_result = await db_session.execute(
            select(orm.Role).where(
                orm.Role.id.in_(role_ids),
                orm.Role.deleted_at.is_(None)
            )
        )
        roles = list(roles_result.scalars().all())
        found_role_ids = {role.id for role in roles}
        missing_role_ids = set(role_ids) - found_role_ids
        if missing_role_ids:
            raise ValueError(f"Roles not found or inactive: {missing_role_ids}")

        for role in roles:
            user_role = orm.UserRole(
                user_id=user.id,
                role_id=role.id,
                created_by=created_by,
                updated_by=created_by,
            )
            db_session.add(user_role)

    await db_session.commit()
    await db_session.refresh(user)

    return user


async def update_user(
    db_session: AsyncSession,
    user_id: uuid.UUID,
    attrs: schema.UpdateUser
) -> Tuple[schema.UserDetails | None, err_schema.Error | None]:

    stmt = select(orm.User).options(
        selectinload(orm.User.user_roles)
        .selectinload(orm.UserRole.role)
        .selectinload(orm.Role.permissions),
        selectinload(orm.User.user_groups)
        .selectinload(orm.UserGroup.group)
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

    # Update groups - Handle soft delete properly
    if attrs.group_ids is not None:
        from papermerge.core.const import SYSTEM_USER_ID

        # Soft delete existing user_groups by setting deleted_at
        for existing_user_group in user.user_groups:
            if existing_user_group.deleted_at is None:  # Only mark active ones as deleted
                existing_user_group.deleted_at = func.now()

        # Create new UserGroup entries for the new groups
        if attrs.group_ids:  # Only if there are new groups to add
            stmt = select(orm.Group).where(orm.Group.id.in_(attrs.group_ids))
            new_groups = list((await db_session.execute(stmt)).scalars().all())

            for group in new_groups:
                new_user_group = orm.UserGroup(
                    user=user,
                    group=group,
                    created_by=SYSTEM_USER_ID,
                    updated_by=SYSTEM_USER_ID,
                )
                db_session.add(new_user_group)

    # Update roles - Handle soft delete properly
    if attrs.role_ids is not None:
        from papermerge.core.const import SYSTEM_USER_ID

        # Soft delete existing user_roles by setting deleted_at
        for existing_user_role in user.user_roles:
            if existing_user_role.deleted_at is None:  # Only mark active ones as deleted
                existing_user_role.deleted_at = func.now()

        # Create new UserRole entries for the new roles
        if attrs.role_ids:  # Only if there are new roles to add
            stmt = select(orm.Role).where(orm.Role.id.in_(attrs.role_ids))
            new_roles = list((await db_session.execute(stmt)).scalars().all())

            for role in new_roles:
                new_user_role = orm.UserRole(
                    user=user,
                    role=role,
                    created_by=SYSTEM_USER_ID,
                    updated_by=SYSTEM_USER_ID,
                )
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
        selectinload(orm.User.user_groups)
        .selectinload(orm.UserGroup.group)
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

    # Get active groups
    active_groups = []
    for user_group in user.user_groups:
        if user_group.deleted_at is None:  # Only active groups
            active_groups.append(user_group.group)

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
        groups=active_groups,
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
    deleted_by_user_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
    username: str | None = None,
    force_delete: bool = False
) -> bool:
    """
    Soft delete a user and their associations.

    Args:
        db_session: Database session
        deleted_by_user_id: ID of user performing the deletion
        user_id: ID of user to delete (optional)
        username: Username of user to delete (optional)
        force_delete: If True, delete even if user owns resources

    Returns:
        bool: True if deletion successful

    Raises:
        NoResultFound: If user doesn't exist
        ValueError: If user owns resources and force_delete=False or if neither user_id nor username provided
    """
    if user_id is not None:
        stmt = select(orm.User).where(
            orm.User.id == user_id,
            orm.User.deleted_at.is_(None)
        )
    elif username is not None:
        stmt = select(orm.User).where(
            orm.User.username == username,
            orm.User.deleted_at.is_(None)
        )
    else:
        raise ValueError("Either username or user_id parameter must be provided")

    result = await db_session.execute(stmt)
    user = result.scalars().first()

    if not user:
        identifier = f"id {user_id}" if user_id else f"username '{username}'"
        raise NoResultFound(f"User with {identifier} not found or already deleted")

    # Soft delete all user-role associations
    user_roles_update_stmt = update(orm.UserRole).where(
        orm.UserRole.user_id == user.id,
        orm.UserRole.deleted_at.is_(None)
    ).values(
        deleted_at=utc_now(),
        deleted_by=deleted_by_user_id,
        updated_at=utc_now(),
        updated_by=deleted_by_user_id
    )
    await db_session.execute(user_roles_update_stmt)

    # Soft delete all user-group associations
    user_groups_update_stmt = update(orm.UserGroup).where(
        orm.UserGroup.user_id == user.id,
        orm.UserGroup.deleted_at.is_(None)
    ).values(
        deleted_at=utc_now(),
        deleted_by=deleted_by_user_id,
        updated_at=utc_now(),
        updated_by=deleted_by_user_id
    )
    await db_session.execute(user_groups_update_stmt)

    # Soft delete the user
    user.deleted_at = utc_now()
    user.deleted_by = deleted_by_user_id
    user.updated_at = utc_now()
    user.updated_by = deleted_by_user_id

    await db_session.commit()
    return True


async def get_users_count(db_session: AsyncSession) -> int:
    stmt = select(func.count(orm.User.id))
    return (await db_session.execute(stmt)).scalar()


async def change_password(
    db_session: AsyncSession,
    user_id: uuid.UUID,
    password: str
) -> Tuple[schema.User | None, err_schema.Error | None]:
    stmt = select(orm.User).options(
        selectinload(orm.User.user_roles),
        selectinload(orm.User.user_groups)
    ).where(orm.User.id == user_id)

    result = await db_session.execute(stmt)
    db_user = result.scalar()

    if db_user is None:
        error = err_schema.Error(messages=[f"User with id {user_id} not found"])
        return None, error

    db_user.password = pbkdf2_sha256.hash(password)

    try:
        await db_session.commit()
    except Exception as e:
        await db_session.rollback()
        error = err_schema.Error(messages=[str(e)])
        return None, error

    await db_session.refresh(db_user)
    user = schema.User.model_validate(db_user)

    return user, None


async def user_belongs_to(
    db_session: AsyncSession, group_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    """Does user belong to group? (active membership only)"""
    stmt = (
        select(func.count())
        .select_from(orm.UserGroup)
        .where(
            orm.UserGroup.user_id == user_id,
            orm.UserGroup.group_id == group_id,
            orm.UserGroup.deleted_at.is_(None),  # Only active memberships
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

        elif filter_name == "with_roles":
            # Users who have ANY of the specified roles (active user roles only)
            role_names = value if isinstance(value, list) else [value]
            condition = and_(
                orm.UserRole.user_id == orm.User.id,
                orm.UserRole.deleted_at.is_(None),  # Only active user roles
                orm.Role.deleted_at.is_(None),      # Only active roles
                orm.Role.name.in_(role_names)
            )

        elif filter_name == "without_roles":
            # Users who do NOT have ANY of the specified roles
            role_names = value if isinstance(value, list) else [value]
            # Subquery to find users who have these roles
            users_with_roles_subquery = (
                select(orm.UserRole.user_id)
                .join(orm.Role, orm.UserRole.role_id == orm.Role.id)
                .where(
                    and_(
                        orm.UserRole.deleted_at.is_(None),
                        orm.Role.deleted_at.is_(None),
                        orm.Role.name.in_(role_names)
                    )
                )
            )
            condition = orm.User.id.notin_(users_with_roles_subquery)

        elif filter_name == "with_groups":
            # Users who have ANY of the specified groups (active user groups only)
            group_names = value if isinstance(value, list) else [value]
            condition = and_(
                orm.UserGroup.user_id == orm.User.id,
                orm.UserGroup.deleted_at.is_(None),  # Only active user groups
                orm.Group.deleted_at.is_(None),      # Only active groups
                orm.Group.name.in_(group_names)
            )

        elif filter_name == "without_groups":
            # Users who do NOT have ANY of the specified groups
            group_names = value if isinstance(value, list) else [value]
            # Subquery to find users who have these groups
            users_with_groups_subquery = (
                select(orm.UserGroup.user_id)
                .join(orm.Group, orm.UserGroup.group_id == orm.Group.id)
                .where(
                    and_(
                        orm.UserGroup.deleted_at.is_(None),
                        orm.Group.deleted_at.is_(None),
                        orm.Group.name.in_(group_names)
                    )
                )
            )
            condition = orm.User.id.notin_(users_with_groups_subquery)

        elif filter_name == "with_scopes":
            # Users who have ANY of the specified scopes (through roles)
            scope_names = value if isinstance(value, list) else [value]
            condition = and_(
                orm.UserRole.user_id == orm.User.id,
                orm.UserRole.deleted_at.is_(None),    # Only active user roles
                orm.Role.deleted_at.is_(None),        # Only active roles
                orm.Permission.codename.in_(scope_names)
            )

        elif filter_name == "without_scopes":
            # Users who do NOT have ANY of the specified scopes
            scope_names = value if isinstance(value, list) else [value]
            # Subquery to find users who have these scopes through roles
            users_with_scopes_subquery = (
                select(orm.UserRole.user_id)
                .join(orm.Role, orm.UserRole.role_id == orm.Role.id)
                .join(orm.roles_permissions_association, orm.Role.id == orm.roles_permissions_association.c.role_id)
                .join(orm.Permission, orm.roles_permissions_association.c.permission_id == orm.Permission.id)
                .where(
                    and_(
                        orm.UserRole.deleted_at.is_(None),
                        orm.Role.deleted_at.is_(None),
                        orm.Permission.codename.in_(scope_names)
                    )
                )
            )
            condition = orm.User.id.notin_(users_with_scopes_subquery)

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



async def delete_user_safe(
    session: AsyncSession,
    user_id: uuid.UUID
) -> Tuple[bool, str | None]:
    """
    Delete a user only if they don't own any resources.

    Returns:
        (success, error_message)
    """
    from papermerge.core.features.ownership.db import api as ownership_api

    # Check if user owns any resources
    has_resources = await ownership_api.has_owned_resources(
        session=session,
        owner_type=OwnerType.USER,
        owner_id=user_id
    )

    if has_resources:
        counts = await ownership_api.get_owned_resource_counts(
            session=session,
            owner_type=OwnerType.USER,
            owner_id=user_id
        )

        resource_list = ", ".join([
            f"{count} {rtype}(s)"
            for rtype, count in counts.items()
            if count > 0
        ])

        return (
            False,
            f"Cannot delete user: owns {resource_list}. "
            f"Transfer or delete these resources first."
        )

    # Safe to delete
    from papermerge.core.features.users.db import orm as user_orm
    user = await session.get(user_orm.User, user_id)
    if user:
        await session.delete(user)
        await session.commit()

    return (True, None)


async def get_user_group_users(
    db_session: AsyncSession,
    user_id: uuid.UUID
) -> list[schema.UserSimple]:
    """
    Gets all users who are members of the same groups as the current user.
    Excludes the current user from results.

    SQL equivalent:
    SELECT DISTINCT u.id, u.username, u.email
    FROM users u
    JOIN users_groups ug ON ug.user_id = u.id
    WHERE ug.group_id IN (
        SELECT group_id
        FROM users_groups
        WHERE user_id = <user_id>
        AND deleted_at IS NULL
    )
    AND ug.deleted_at IS NULL
    AND u.deleted_at IS NULL
    AND u.id != <user_id>  -- Exclude current user
    ORDER BY u.username

    Args:
        db_session: Database session
        user_id: Current user's UUID

    Returns:
        List of UserSimple objects (users from same groups, excluding current user)

    Raises:
        SQLAlchemy exceptions on database errors
    """
    try:
        # First, get all group IDs the user belongs to
        user_groups_stmt = (
            select(orm.UserGroup.group_id)
            .where(
                orm.UserGroup.user_id == user_id,
                orm.UserGroup.deleted_at.is_(None)
            )
        )

        # Then get all users in those groups
        stmt = (
            select(orm.User.id, orm.User.username, orm.User.email)
            .join(orm.UserGroup, orm.UserGroup.user_id == orm.User.id)
            .where(
                orm.UserGroup.group_id.in_(user_groups_stmt),
                orm.UserGroup.deleted_at.is_(None),
                orm.User.deleted_at.is_(None),
                orm.User.id != user_id  # Exclude current user
            )
            .distinct()
            .order_by(orm.User.username)
        )

        results = (await db_session.execute(stmt)).all()

        models = []
        for user_id_val, username, email in results:
            user = schema.UserSimple(
                id=user_id_val,
                username=username,
                email=email
            )
            models.append(user)

        return models

    except Exception as e:
        logger.error(f"Error in get_user_group_users for user {user_id}: {e}")
        raise
