import logging
import math
import uuid
from typing import Tuple, Optional, Dict, Any

from sqlalchemy import delete, select, func, and_, or_
from sqlalchemy.orm import selectinload, aliased
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from papermerge.core import schema, orm
from papermerge.core.features.auth import scopes

logger = logging.getLogger(__name__)


async def get_role(db_session: AsyncSession, role_id: uuid.UUID) -> schema.RoleDetails:

    stmt = (
        select(orm.Role)
        .options(selectinload(orm.Role.permissions))
        .where(orm.Role.id == role_id)
    )
    db_item = (await db_session.scalars(stmt)).unique().one()
    db_item.scopes = sorted([p.codename for p in db_item.permissions])

    result = schema.RoleDetails.model_validate(db_item)

    return result


async def get_roles(
    db_session: AsyncSession,
    *,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filters: Optional[Dict[str, Dict[str, Any]]] = None
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

    Returns:
        Paginated response with roles
    """

    # Create user aliases for joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')

    # Build base query with joins for user data
    base_query = (
        select(orm.Role)
        .join(created_user, orm.Role.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Role.updated_by == updated_user.id, isouter=True)
    )

    # Apply filters
    where_conditions = []
    if filters:
        where_conditions = _build_filter_conditions(filters, created_user, updated_user)

    if where_conditions:
        base_query = base_query.where(and_(*where_conditions))

    # Count total items (using the same filters)
    count_query = (
        select(func.count(orm.Role.id))
        .join(created_user, orm.Role.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Role.updated_by == updated_user.id, isouter=True)
    )

    if where_conditions:
        count_query = count_query.where(and_(*where_conditions))

    total_roles = (await db_session.execute(count_query)).scalar()

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_sorting(base_query, sort_by, sort_direction, created_user, updated_user)
    else:
        # Default sorting by created_at desc
        base_query = base_query.order_by(orm.Role.created_at.desc())

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Modify query to include user data we need
    paginated_query_with_users = (
        base_query
        .add_columns(
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username')
        )
        .limit(page_size)
        .offset(offset)
    )

    # Execute query - get tuples with role and user data
    results = (await db_session.execute(paginated_query_with_users)).all()

    # Convert to schema models with proper user data
    items = []
    for row in results:
        role = row[0]  # The Role object
        role_data = {
            "id": role.id,
            "name": role.name,
            "created_at": role.created_at,
            "updated_at": role.updated_at,
            "created_by": schema.ByUser(
                id=row.created_by_id,
                username=row.created_by_username
            ),
            "updated_by": schema.ByUser(
                id=row.updated_by_id,
                username=row.updated_by_username
            )
        }
        items.append(schema.RoleEx(**role_data))

    # Calculate total pages
    total_pages = math.ceil(total_roles / page_size) if total_roles > 0 else 1

    return schema.PaginatedResponse[schema.RoleEx](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages
    )


async def get_roles_without_pagination(db_session: AsyncSession) -> list[schema.Role]:
    stmt = select(orm.Role)

    db_roles = (await db_session.scalars(stmt)).all()
    items = [schema.Role.model_validate(db_role) for db_role in db_roles]

    return items


async def create_role(
    db_session: AsyncSession,
    name: str,
    scopes: list[str],
    exists_ok: bool = False
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

    role = orm.Role(name=name, permissions=perms)
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
    db_session: AsyncSession, role_id: uuid.UUID, attrs: schema.UpdateRole
) -> schema.RoleDetails:
    stmt = select(orm.Permission).where(orm.Permission.codename.in_(attrs.scopes))
    perms = (await db_session.execute(stmt)).scalars().all()

    stmt = select(orm.Role).options(selectinload(orm.Role.permissions)).where(orm.Role.id == role_id)
    role = (await db_session.execute(stmt, params={"id": role_id})).scalars().one()
    db_session.add_all([role, *perms])
    role.name = attrs.name
    role.permissions = perms

    await db_session.commit()

    result = schema.RoleDetails(
        id=role.id, name=role.name, scopes=[p.codename for p in perms]
    )

    return result


async def delete_role(
    db_session: AsyncSession,
    role_id: uuid.UUID,
):
    stmt = select(orm.Role).where(orm.Role.id == role_id)
    role = (await db_session.execute(stmt, params={"id": role_id})).scalars().one()
    await db_session.delete(role)
    await db_session.commit()


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



def _build_filter_conditions(
        filters: Dict[str, Dict[str, Any]],
        created_user,
        updated_user
) -> list:
    """Build SQLAlchemy WHERE conditions from filters dictionary."""
    conditions = []

    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")
        operator = filter_config.get("operator", "eq")

        if not value:
            continue

        condition = None

        if filter_name == "scope":
            # Filter by permissions/scopes - assuming you have a permissions relationship
            if operator == "in" and isinstance(value, list):
                condition = orm.Role.permissions.any(
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


def _apply_sorting(query, sort_by: str, sort_direction: str, created_user, updated_user):
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

    if sort_column is not None:
        if sort_direction.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    return query
