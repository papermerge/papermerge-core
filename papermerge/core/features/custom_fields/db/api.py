import math
import logging
import uuid
from typing import Optional, Dict, Any

from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import aliased
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, orm
from papermerge.core.db.exceptions import ResourceAccessDenied

logger = logging.getLogger(__name__)



ORDER_BY_MAP = {
    "type": orm.CustomField.type.asc(),
    "-type": orm.CustomField.type.desc(),
    "name": orm.CustomField.name.asc(),
    "-name": orm.CustomField.name.desc(),
    "group_name": orm.Group.name.asc().nullsfirst(),
    "-group_name": orm.Group.name.desc().nullslast(),
}


async def get_custom_fields(
    db_session: AsyncSession,
    *,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filters: Optional[Dict[str, Dict[str, Any]]] = None,
    include_deleted: bool = False,
    include_archived: bool = True
) -> schema.PaginatedResponse[schema.CustomFieldEx]:
    """
    Get paginated custom fields with filtering and sorting support.

    Args:
        db_session: Database session
        user_id: Current user ID (for access control)
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
        include_deleted: Whether to include soft-deleted custom fields
        include_archived: Whether to include archived custom fields

    Returns:
        Paginated response with custom fields including full audit trail
    """

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    deleted_user = aliased(orm.User, name='deleted_user')
    archived_user = aliased(orm.User, name='archived_user')
    owner_user = aliased(orm.User, name='owner_user')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Build base query with joins for all audit user data and group info
    base_query = (
        select(orm.CustomField)
        .join(created_user, orm.CustomField.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.CustomField.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.CustomField.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.CustomField.archived_by == archived_user.id, isouter=True)
        .join(owner_user, orm.CustomField.user_id == owner_user.id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.CustomField.group_id, isouter=True)
    )

    # Apply access control - user can see custom fields they own or from their groups
    access_control_condition = or_(
        orm.CustomField.user_id == user_id,
        orm.CustomField.group_id.in_(user_groups_subquery)
    )

    where_conditions = [access_control_condition]

    # Apply default visibility filters
    if not include_deleted:
        where_conditions.append(orm.CustomField.deleted_at.is_(None))

    if not include_archived:
        where_conditions.append(orm.CustomField.archived_at.is_(None))

    # Apply custom filters
    if filters:
        filter_conditions = _build_custom_field_filter_conditions(
            filters, created_user, updated_user, deleted_user, archived_user
        )
        where_conditions.extend(filter_conditions)

    base_query = base_query.where(and_(*where_conditions))

    # Count total items (using the same filters)
    count_query = (
        select(func.count(orm.CustomField.id))
        .join(created_user, orm.CustomField.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.CustomField.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.CustomField.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.CustomField.archived_by == archived_user.id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.CustomField.group_id, isouter=True)
        .where(and_(*where_conditions))
    )

    total_custom_fields = (await db_session.execute(count_query)).scalar()

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_custom_field_sorting(
            base_query, sort_by, sort_direction,
            created_user=created_user,
            updated_user=updated_user,
            deleted_user=deleted_user,
            archived_user=archived_user
        )
    else:
        # Default sorting by created_at desc
        base_query = base_query.order_by(orm.CustomField.created_at.desc())

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Modify query to include all audit user data and group info
    paginated_query_with_users = (
        base_query
        .add_columns(
            # Group info
            orm.Group.id.label('group_id'),
            orm.Group.name.label('group_name'),
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
            archived_user.username.label('archived_by_username'),
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
        )
        .limit(page_size)
        .offset(offset)
    )

    # Execute query - get tuples with custom field and user/group data
    results = (await db_session.execute(paginated_query_with_users)).all()

    # Convert to schema models with complete audit trail
    items = []
    for row in results:
        custom_field = row[0]  # The CustomField object

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

        if custom_field.user_id:
            owned_by = schema.OwnedBy(
                id=custom_field.user_id,
                name=row.owner_username,
                type="user"
            )
        else:  # group_id is not null (enforced by check constraint)
            owned_by = schema.OwnedBy(
                id=row.group_id,
                name=row.group_name,
                type="group"
            )

        custom_field_data = {
            "id": custom_field.id,
            "name": custom_field.name,
            "type": custom_field.type,
            "extra_data": custom_field.extra_data,
            "group_id": row.group_id,
            "group_name": row.group_name,
            "created_at": custom_field.created_at,
            "updated_at": custom_field.updated_at,
            "deleted_at": custom_field.deleted_at,
            "archived_at": custom_field.archived_at,
            "created_by": created_by,
            "updated_by": updated_by,
            "deleted_by": deleted_by,
            "archived_by": archived_by,
            "owned_by": owned_by,
        }

        items.append(schema.CustomFieldEx(**custom_field_data))

    # Calculate total pages
    total_pages = math.ceil(total_custom_fields / page_size) if total_custom_fields > 0 else 1

    return schema.PaginatedResponse[schema.CustomFieldEx](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages,
        total_items=total_custom_fields
    )



async def get_custom_fields_without_pagination(
    db_session: AsyncSession,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
) -> list[schema.CustomField]:
    stmt_base = select(orm.CustomField).order_by(orm.CustomField.name.asc())

    if group_id:
        stmt = stmt_base.where(orm.CustomField.group_id == group_id)
    elif user_id:
        stmt = stmt_base.where(orm.CustomField.user_id == user_id)
    else:
        raise ValueError("Both: group_id and user_id are missing")

    db_cfs = (await db_session.scalars(stmt)).all()
    items = [schema.CustomField.model_validate(db_cf) for db_cf in db_cfs]

    return items


async def create_custom_field(
    session: AsyncSession,
    name: str,
    type: schema.CustomFieldType,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
    extra_data: str | None = None,
) -> schema.CustomField:
    cfield = None

    if user_id:
        cfield = orm.CustomField(
            id=uuid.uuid4(),
            name=name,
            type=type,
            extra_data=extra_data,
            user_id=user_id,
        )
    elif group_id:
        cfield = orm.CustomField(
            id=uuid.uuid4(),
            name=name,
            type=type,
            extra_data=extra_data,
            group_id=group_id,
        )

    session.add(cfield)
    await session.commit()
    result = schema.CustomField.model_validate(cfield)

    return result


async def get_custom_field(
    session: AsyncSession,
    user_id: uuid.UUID,
    custom_field_id: uuid.UUID
) -> schema.CustomFieldDetails:
    """
    Get a single custom field with full audit trail.

    Args:
        session: Database session
        user_id: Current user ID (for access control)
        custom_field_id: ID of the custom field to retrieve

    Returns:
        CustomFieldDetails with complete audit trail and ownership info

    Raises:
        NoResultFound: If custom field doesn't exist
        CustomFieldAccessError: If user doesn't have permission to access the custom field
    """

    # First check if the custom field exists at all
    exists_stmt = select(orm.CustomField.id).where(orm.CustomField.id == custom_field_id)
    exists_result = await session.execute(exists_stmt)
    if not exists_result.scalar():
        raise NoResultFound(f"Custom field with id {custom_field_id} not found")

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    deleted_user = aliased(orm.User, name='deleted_user')
    archived_user = aliased(orm.User, name='archived_user')
    owner_user = aliased(orm.User, name='owner_user')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Build query with all audit user joins and group info
    stmt = (
        select(orm.CustomField)
        .join(created_user, orm.CustomField.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.CustomField.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.CustomField.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.CustomField.archived_by == archived_user.id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.CustomField.group_id, isouter=True)
        .join(owner_user, orm.CustomField.user_id == owner_user.id, isouter=True)
        .add_columns(
            # Group info
            orm.Group.id.label('group_id'),
            orm.Group.name.label('group_name'),
            # Owner user info
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
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
        .where(
            and_(
                orm.CustomField.id == custom_field_id,
                # Access control: user can access if they own it directly or through group
                or_(
                    orm.CustomField.user_id == user_id,
                    orm.CustomField.group_id.in_(user_groups_subquery)
                )
            )
        )
    )

    # Execute query and get single result
    result = await session.execute(stmt)
    row = result.unique().first()

    # If no row returned, user doesn't have access (we know the custom field exists)
    if not row:
        raise ResourceAccessDenied(f"User {user_id} does not have permission to access custom field {custom_field_id}")

    custom_field = row[0]  # The CustomField object

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

    # Determine owner based on which ID exists
    if custom_field.user_id:
        owned_by = schema.OwnedBy(
            id=custom_field.user_id,
            name=row.owner_username,
            type="user"
        )
    else:  # group_id is not null (enforced by check constraint)
        owned_by = schema.OwnedBy(
            id=row.group_id,
            name=row.group_name,
            type="group"
        )

    # Build the complete CustomFieldDetails object
    custom_field_data = {
        "id": custom_field.id,
        "name": custom_field.name,
        "type": custom_field.type,
        "extra_data": custom_field.extra_data,
        "owned_by": owned_by,
        "created_at": custom_field.created_at,
        "updated_at": custom_field.updated_at,
        "deleted_at": custom_field.deleted_at,
        "archived_at": custom_field.archived_at,
        "created_by": created_by,
        "updated_by": updated_by,
        "deleted_by": deleted_by,
        "archived_by": archived_by
    }

    return schema.CustomFieldDetails(**custom_field_data)

async def delete_custom_field(session: AsyncSession, custom_field_id: uuid.UUID):
    stmt = select(orm.CustomField).where(orm.CustomField.id == custom_field_id)
    cfield = (await session.execute(stmt)).scalars().one()
    await session.delete(cfield)
    await session.commit()


async def update_custom_field(
    session: AsyncSession, custom_field_id: uuid.UUID, attrs: schema.UpdateCustomField
) -> schema.CustomField:
    stmt = select(orm.CustomField).where(orm.CustomField.id == custom_field_id)
    cfield = (await session.execute(stmt)).scalars().one()
    session.add(cfield)

    if attrs.name:
        cfield.name = attrs.name

    if attrs.type:
        cfield.type = attrs.type

    if attrs.extra_data:
        cfield.extra_data = attrs.extra_data

    if attrs.group_id:
        cfield.user_id = None
        cfield.group_id = attrs.group_id
    elif attrs.user_id:
        cfield.user_id = attrs.user_id
        cfield.group_id = None
    else:
        raise ValueError(
            "Either attrs.user_id or attrs.group_id should be non-empty value"
        )

    await session.commit()
    result = schema.CustomField.model_validate(cfield)

    return result



def _build_custom_field_filter_conditions(
        filters: Dict[str, Dict[str, Any]],
        created_user,
        updated_user,
        deleted_user,
        archived_user
) -> list:
    """Build SQLAlchemy WHERE conditions from filters dictionary for custom fields."""
    conditions = []

    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")
        operator = filter_config.get("operator", "eq")

        if not value:
            continue

        condition = None

        if filter_name == "types":
            if operator == "in" and isinstance(value, list):
                condition = orm.CustomField.type.in_(value)

        elif filter_name == "free_text":
            # Search across multiple text fields
            search_term = f"%{value}%"

            condition = or_(
                orm.CustomField.name.ilike(search_term),
                orm.CustomField.type.ilike(search_term),
                orm.Group.name.ilike(search_term),  # Group name search
            )

        elif filter_name == "name":
            if operator == "like":
                condition = orm.CustomField.name.ilike(f"%{value}%")
            elif operator == "eq":
                condition = orm.CustomField.name == value
            elif operator == "in" and isinstance(value, list):
                condition = orm.CustomField.name.in_(value)

        if condition is not None:
            conditions.append(condition)

    return conditions


def _apply_custom_field_sorting(
        query,
        sort_by: str,
        sort_direction: str,
        created_user,
        updated_user,
        deleted_user,
        archived_user,
):
    """Apply sorting to the custom fields query."""
    sort_column = None

    # Map sort_by to actual columns
    if sort_by == "id":
        sort_column = orm.CustomField.id
    elif sort_by == "name":
        sort_column = orm.CustomField.name
    elif sort_by == "created_at":
        sort_column = orm.CustomField.created_at
    elif sort_by == "updated_at":
        sort_column = orm.CustomField.updated_at
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
