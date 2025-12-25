import logging
import math
import uuid
from typing import Tuple, Optional, Dict, Any

from sqlalchemy import delete, select, func, and_, or_, update
from sqlalchemy.orm import selectinload, aliased
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, NoResultFound

from papermerge.core.utils.tz import utc_now
from papermerge.core import schema, orm, const
from papermerge.core.features.auth import scopes

logger = logging.getLogger(__name__)


async def get_role(
    db_session: AsyncSession,
    role_id: uuid.UUID
) -> schema.RoleDetails:
    # Create aliases for the user tables to avoid conflicts
    created_by_user = aliased(orm.User)
    updated_by_user = aliased(orm.User)

    stmt = (
        select(
            orm.Role,
            created_by_user.id.label('created_by_id'),
            created_by_user.username.label('created_by_username'),
            updated_by_user.id.label('updated_by_id'),
            updated_by_user.username.label('updated_by_username'),
            updated_by_user.username.label('updated_by_username')
        )
        .options(
            selectinload(orm.Role.permissions),
            selectinload(orm.Role.user_roles).selectinload(orm.UserRole.user)
        )
        .outerjoin(created_by_user, orm.Role.created_by == created_by_user.id)
        .outerjoin(updated_by_user, orm.Role.updated_by == updated_by_user.id)
        .where(orm.Role.id == role_id)
    )

    result = (await db_session.execute(stmt)).one()
    db_item = result[0]

    db_item.scopes = sorted([p.codename for p in db_item.permissions])

    created_by = None
    if result.created_by_id:
        created_by = schema.ByUser(
            id=result.created_by_id,
            username=result.created_by_username
        )

    updated_by = None
    if result.updated_by_id:
        updated_by = schema.ByUser(
            id=result.updated_by_id,
            username=result.updated_by_username
        )

    used_by = [
        schema.ByUser(id=ur.user.id, username=ur.user.username)
        for ur in db_item.user_roles
        if ur.deleted_at is None
    ]

    role_details = schema.RoleDetails(
        id=db_item.id,
        name=db_item.name,
        scopes=db_item.scopes,
        created_at=db_item.created_at,
        created_by=created_by,
        updated_at=db_item.updated_at,
        updated_by=updated_by,
        used_by=used_by
    )

    return role_details


async def get_roles(
    db_session: AsyncSession,
    *,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filters: Optional[Dict[str, Dict[str, Any]]] = None,
    include_deleted: bool = False,
    include_archived: bool = True
) -> schema.PaginatedResponse[schema.RoleEx]:
    """
    Get paginated roles with filtering and sorting support.

    Args:
        db_session: Database session
        page_size: Number of items per page
        page_number: Page number (1-based)
        sort_by: Column to sort by
        sort_direction: Sort direction ('asc' or 'desc')
        filters: Dictionary of filters with format:
            {
                "filter_name": {
                    "value": filter_value,
                    "operator": "in" | "like" | "eq" | "free_text"
                }
            }
        include_deleted: Whether to include soft-deleted roles
        include_archived: Whether to include archived roles

    Returns:
        Paginated response with roles including full audit trail
    """

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    deleted_user = aliased(orm.User, name='deleted_user')
    archived_user = aliased(orm.User, name='archived_user')

    # Build base query with joins for all audit user data
    base_query = (
        select(orm.Role)
        .join(created_user, orm.Role.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Role.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.Role.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.Role.archived_by == archived_user.id, isouter=True)
    )

    # Apply default visibility filters
    where_conditions = []

    if not include_deleted:
        where_conditions.append(orm.Role.deleted_at.is_(None))

    if not include_archived:
        where_conditions.append(orm.Role.archived_at.is_(None))

    # Apply custom filters
    if filters:
        filter_conditions = _build_filter_conditions(
            filters, created_user, updated_user, deleted_user, archived_user
        )
        where_conditions.extend(filter_conditions)

    if where_conditions:
        base_query = base_query.where(and_(*where_conditions))

    # Count total items (using the same filters)
    count_query = (
        select(func.count(orm.Role.id))
        .join(created_user, orm.Role.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Role.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.Role.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.Role.archived_by == archived_user.id, isouter=True)
    )

    if where_conditions:
        count_query = count_query.where(and_(*where_conditions))

    total_roles = (await db_session.execute(count_query)).scalar()

    # Apply sorting
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
        base_query = base_query.order_by(orm.Role.created_at.desc())

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
        role = row[0]  # The Role object

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

        role_data = {
            "id": role.id,
            "name": role.name,
            "created_at": role.created_at,
            "updated_at": role.updated_at,
            "deleted_at": role.deleted_at,
            "archived_at": role.archived_at,
            "created_by": created_by,
            "updated_by": updated_by,
            "deleted_by": deleted_by,
            "archived_by": archived_by
        }

        items.append(schema.RoleEx(**role_data))

    # Calculate total pages
    total_pages = math.ceil(total_roles / page_size) if total_roles > 0 else 1

    return schema.PaginatedResponse[schema.RoleEx](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages,
        total_items=total_roles
    )

async def get_roles_without_pagination(db_session: AsyncSession) -> list[schema.Role]:
    stmt = select(orm.Role).where(
        orm.Role.deleted_at.is_(None),
        orm.Role.archived_at.is_(None),
    ).order_by(orm.Role.name.asc())

    db_roles = (await db_session.scalars(stmt)).all()
    items = [schema.Role.model_validate(db_role) for db_role in db_roles]

    return items


async def create_role(
    db_session: AsyncSession,
    name: str,
    scopes: list[str],
    exists_ok: bool = False,
    created_by: uuid.UUID = const.SYSTEM_USER_ID,
) -> Tuple[schema.Role | None, str | None]:
    """Creates a role with given scopes"""


    stmt_total_permissions = select(func.count(orm.Permission.id))
    perms_count = (await db_session.execute(stmt_total_permissions)).scalar()
    if perms_count == 0:
        error = (
            "There are no permissions in the system."
            " Did you forget to run `paper-cli perms sync`?"
        )
        return None, error

    if exists_ok:
        stmt = select(orm.Role).where(orm.Role.name == name)
        result = (await db_session.execute(stmt)).scalars().all()
        if len(result) >= 1:
            logger.info(f"Role {name} already exists")
            return schema.Role.model_validate(result[0]), None

    stmt = select(orm.Permission).where(orm.Permission.codename.in_(scopes))
    perms = (await db_session.execute(stmt)).scalars().all()

    found_codenames = {p.codename for p in perms}
    missing = set(scopes) - found_codenames
    if missing:
        error = f"Unknown permission scopes: {', '.join(missing)}"
        return None, error

    role = orm.Role(
        name=name,
        permissions=perms,
        created_by=created_by,
        updated_by=created_by,
        created_at=utc_now(),
        updated_at=utc_now()
    )
    db_session.add(role)
    try:
        await db_session.commit()
        await db_session.refresh(role, attribute_names=["permissions"])
        result = schema.Role.model_validate(role)
        return result, None
    except IntegrityError as e:
        await db_session.rollback()
        error_msg = str(e).lower()
        logger.warning(f"Role creation failed due to constraint violation: {e}")
        if "unique" in error_msg:
            return None, f"Role '{name}' already exists"
        elif "role_name_not_empty" in error_msg or "check constraint" in error_msg:
            return None, "Role name cannot be empty"
        else:
            return None, "Invalid role data"
    except Exception as e:
        await  db_session.rollback()
        logger.error(f"Unexpected error creating role '{name}': {e}")
        return None, "Failed to create role due to an internal error"


async def update_role(
    db_session: AsyncSession,
    role_id: uuid.UUID,
    attrs: schema.UpdateRole
) -> schema.RoleDetails:
    # Validate permissions exist
    stmt = select(orm.Permission).where(orm.Permission.codename.in_(attrs.scopes))
    perms = (await db_session.execute(stmt)).scalars().all()

    # Check if all requested permissions were found
    found_codenames = {p.codename for p in perms}
    requested_codenames = set(attrs.scopes)
    if missing := requested_codenames - found_codenames:
        raise ValueError(f"Permissions not found: {missing}")

    # Get role with permissions and user relationships
    stmt = select(orm.Role).options(
        selectinload(orm.Role.permissions),
        selectinload(orm.Role.user_roles).selectinload(orm.UserRole.user)
    ).where(
        orm.Role.id == role_id
    )
    role = (await db_session.execute(stmt)).scalars().one_or_none()

    if not role:
        raise ValueError(f"Role with id {role_id} not found")

    # Update role
    role.name = attrs.name
    role.permissions = perms  # type: ignore

    try:
        await db_session.commit()
    except IntegrityError as e:
        await db_session.rollback()
        # Handle unique constraint violation on role name
        if "idx_roles_name_active_unique" in str(e):
            raise ValueError(f"Role name '{attrs.name}' already exists")
        raise

    # Refresh to get updated data
    await db_session.refresh(role)

    # Create aliases for the user tables to get audit information
    created_by_user = aliased(orm.User)
    updated_by_user = aliased(orm.User)

    # Get the complete role data with audit information
    stmt = (
        select(
            orm.Role,
            created_by_user.id.label('created_by_id'),
            created_by_user.username.label('created_by_username'),
            updated_by_user.id.label('updated_by_id'),
            updated_by_user.username.label('updated_by_username')
        )
        .options(
            selectinload(orm.Role.permissions),
            selectinload(orm.Role.user_roles).selectinload(orm.UserRole.user)
        )
        .outerjoin(created_by_user, orm.Role.created_by == created_by_user.id)
        .outerjoin(updated_by_user, orm.Role.updated_by == updated_by_user.id)
        .where(orm.Role.id == role_id)
    )

    result = (await db_session.execute(stmt)).one()
    db_item = result[0]

    # Create scopes list
    scopes = sorted([p.codename for p in db_item.permissions])

    # Create audit user objects
    created_by = None
    if result.created_by_id:
        created_by = schema.ByUser(
            id=result.created_by_id,
            username=result.created_by_username
        )

    updated_by = None
    if result.updated_by_id:
        updated_by = schema.ByUser(
            id=result.updated_by_id,
            username=result.updated_by_username
        )

    # Get users currently assigned to this role (active assignments only)
    used_by = [
        schema.ByUser(id=ur.user.id, username=ur.user.username)
        for ur in db_item.user_roles
        if ur.deleted_at is None
    ]

    return schema.RoleDetails(
        id=db_item.id,
        name=db_item.name,
        scopes=scopes,
        created_at=db_item.created_at,
        created_by=created_by,
        updated_at=db_item.updated_at,
        updated_by=updated_by,
        used_by=used_by
    )


async def get_perms(db_session: AsyncSession) -> list[schema.Permission]:
    db_perms = await db_session.execute(select(orm.Permission).order_by("codename"))
    model_perms = [
        schema.Permission.model_validate(db_perm) for db_perm in db_perms.scalars()
        ]

    return model_perms


async def sync_perms(db_session: AsyncSession):
    """Syncs `core.auth.scopes.SCOPES` with `auth_permissions` table

    In other words makes sure that all scopes defined in
    `core.auth.scopes.SCOPES` are in `auth_permissions` table and other way
    around - any permission found in db table is also in
    `core.auth.scopes.SCOPES`.
    """
    # A. add missing scopes to perms table
    scopes_to_be_added = []
    db_perms = await db_session.scalars(select(orm.Permission))
    model_perms = [schema.Permission.model_validate(db_perm) for db_perm in db_perms]
    perms_codenames = [perm.codename for perm in model_perms]

    # collect missing scopes
    for codename, desc in scopes.SCOPES.items():
        if codename not in perms_codenames:
            scopes_to_be_added.append((codename, desc))
    # add missing scopes
    for scope in scopes_to_be_added:
        db_session.add(orm.Permission(codename=scope[0], name=scope[1]))
    await db_session.commit()

    # B. removes permissions not present in scopes

    scope_codenames = [scope for scope in scopes.SCOPES.keys()]

    stmt = delete(orm.Permission).where(orm.Permission.codename.notin_(scope_codenames))
    await db_session.execute(stmt)
    await db_session.commit()


async def delete_role(
    db_session: AsyncSession,
    role_id: uuid.UUID,
    deleted_by_user_id: uuid.UUID,
    force_delete: bool = False
) -> bool:
    """
    Soft delete a role and its user associations.

    Args:
        db_session: Database session
        role_id: ID of role to delete
        deleted_by_user_id: ID of user performing the deletion
        force_delete: If True, delete even if role has active user associations

    Returns:
        bool: True if deletion successful

    Raises:
        NoResultFound: If role doesn't exist
        ValueError: If role has active users and force_delete=False
    """
    # Check if role exists and is not already deleted
    stmt = select(orm.Role).where(
        orm.Role.id == role_id,
        orm.Role.deleted_at.is_(None)
    )
    result = await db_session.execute(stmt)
    role = result.scalars().first()

    if not role:
        raise NoResultFound(f"Role with id {role_id} not found or already deleted")

    # Check for active user associations if not forcing delete
    if not force_delete:
        user_count_stmt = select(orm.UserRole).where(
            orm.UserRole.role_id == role_id,
            orm.UserRole.deleted_at.is_(None)
        )
        result = await db_session.execute(user_count_stmt)
        active_user_roles = result.scalars().all()

        if active_user_roles:
            raise ValueError(
                f"Cannot delete role '{role.name}' - currently assigned to "
                f"{len(active_user_roles)} users. Use force_delete=True to override "
                f"or archive the role first."
            )

    # Soft delete all user-role associations
    user_roles_update_stmt = update(orm.UserRole).where(
        orm.UserRole.role_id == role_id,
        orm.UserRole.deleted_at.is_(None)
    ).values(
        deleted_at=utc_now(),
        deleted_by=deleted_by_user_id,
        updated_at=utc_now(),
        updated_by=deleted_by_user_id
    )
    await db_session.execute(user_roles_update_stmt)

    # Soft delete the role
    role.deleted_at = utc_now()
    role.deleted_by = deleted_by_user_id
    role.updated_at = utc_now()
    role.updated_by = deleted_by_user_id

    await db_session.commit()
    return True


async def archive_role(
    db_session: AsyncSession,
    role_id: uuid.UUID,
    archived_by_user_id: uuid.UUID
) -> bool:
    """
    Archive a role (keeps user permissions but hides from new assignments).

    Args:
        db_session: Database session
        role_id: ID of role to archive
        archived_by_user_id: ID of user performing the archival

    Returns:
        bool: True if archival successful

    Raises:
        NoResultFound: If role doesn't exist
    """
    stmt = select(orm.Role).where(
        orm.Role.id == role_id,
        orm.Role.deleted_at.is_(None),
        orm.Role.archived_at.is_(None)
    )
    result = await db_session.execute(stmt)
    role = result.scalars().first()

    if not role:
        raise NoResultFound(f"Role with id {role_id} not found or already archived/deleted")

    # Archive the role (keep user associations intact)
    role.archived_at = utc_now()
    role.archived_by = archived_by_user_id
    role.updated_at = utc_now()
    role.updated_by = archived_by_user_id

    await db_session.commit()
    return True


async def restore_role(
    db_session: AsyncSession,
    role_id: uuid.UUID,
    restored_by_user_id: uuid.UUID,
    restore_user_associations: bool = True
) -> bool:
    """
    Restore a soft-deleted role and optionally its user associations.

    Args:
        db_session: Database session
        role_id: ID of role to restore
        restored_by_user_id: ID of user performing the restoration
        restore_user_associations: Whether to restore user associations

    Returns:
        bool: True if restoration successful

    Raises:
        NoResultFound: If role doesn't exist
        ValueError: If role is not deleted
    """
    stmt = select(orm.Role).where(orm.Role.id == role_id)
    result = await db_session.execute(stmt)
    role = result.scalars().first()

    if not role:
        raise NoResultFound(f"Role with id {role_id} not found")

    if role.deleted_at is None:
        raise ValueError(f"Role '{role.name}' is not deleted")

    # Restore the role
    role.deleted_at = None
    role.deleted_by = None
    role.archived_at = None  # Also unarchive if archived
    role.archived_by = None
    role.updated_at = utc_now()
    role.updated_by = restored_by_user_id

    # Conditionally restore user associations
    if restore_user_associations:
        user_roles_restore_stmt = update(orm.UserRole).where(
            orm.UserRole.role_id == role_id,
            orm.UserRole.deleted_at.is_not(None)
        ).values(
            deleted_at=None,
            deleted_by=None,
            updated_at=utc_now(),
            updated_by=restored_by_user_id
        )
        await db_session.execute(user_roles_restore_stmt)

    await db_session.commit()
    return True

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
        operator = filter_config.get("operator", "eq")

        if not value:
            continue

        condition = None

        if filter_name == "include_scopes":
            if operator == "in" and isinstance(value, list):
                condition = orm.Role.permissions.any(
                    orm.Permission.codename.in_(value)
                )
        elif filter_name == "exclude_scopes":
            if operator == "in" and isinstance(value, list):
                condition = ~orm.Role.permissions.any(
                    orm.Permission.codename.in_(value)
                )

        elif filter_name == "created_by_username":
            if operator == "in" and isinstance(value, list):
                condition = created_user.username.in_(value)
            elif operator == "like":
                condition = created_user.username.ilike(f"%{value}%")

        elif filter_name == "updated_by_username":
            if operator == "in" and isinstance(value, list):
                condition = updated_user.username.in_(value)
            elif operator == "like":
                condition = updated_user.username.ilike(f"%{value}%")

        elif filter_name == "free_text":
            # Search across multiple text fields
            search_term = f"%{value}%"

            condition = or_(
                orm.Role.name.ilike(search_term),
                created_user.username.ilike(search_term),
                updated_user.username.ilike(search_term),
                created_user.first_name.ilike(search_term),
                created_user.last_name.ilike(search_term),
                updated_user.first_name.ilike(search_term),
                updated_user.last_name.ilike(search_term),
            )

        elif filter_name == "name":
            if operator == "like":
                condition = orm.Role.name.ilike(f"%{value}%")
            elif operator == "eq":
                condition = orm.Role.name == value
            elif operator == "in" and isinstance(value, list):
                condition = orm.Role.name.in_(value)

        # Add more filter conditions as needed

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
    """Apply sorting to the query."""
    sort_column = None
    # Map sort_by to actual columns
    if sort_by == "id":
        sort_column = orm.Role.id
    elif sort_by == "name":
        sort_column = orm.Role.name
    elif sort_by == "created_at":
        sort_column = orm.Role.created_at
    elif sort_by == "updated_at":
        sort_column = orm.Role.updated_at
    elif sort_by == "created_by":
        # Sort by username of creator
        sort_column = created_user.username
    elif sort_by == "updated_by":
        # Sort by username of updater
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
