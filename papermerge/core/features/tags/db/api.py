import uuid
import math
from typing import Optional, Dict, Any, Tuple

from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import aliased
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.exceptions import EntityNotFound
from papermerge.core import schema
from papermerge.core.db.exceptions import ResourceAccessDenied
from papermerge.core import orm

ORDER_BY_MAP = {
    "name": orm.Tag.name.asc(),
    "-name": orm.Tag.name.desc(),
    "pinned": orm.Tag.pinned.asc(),
    "-pinned": orm.Tag.pinned.desc(),
    "description": orm.Tag.id.asc(),
    "-description": orm.Tag.id.desc(),
    "ID": orm.Tag.id.asc(),
    "-ID": orm.Tag.id.desc(),
    "group_name": orm.Group.name.asc(),
    "-group_name": orm.Group.name.desc(),
}


async def get_tags_without_pagination(
    db_session: AsyncSession,
    *,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
) -> list[schema.Tag]:
    if group_id:
        stmt = select(orm.Tag).where(orm.Tag.group_id == group_id)
    elif user_id:
        stmt = select(orm.Tag).where(orm.Tag.user_id == user_id)
    else:
        raise ValueError("Both: group_id and user_id are missing")

    db_items = (await db_session.scalars(stmt)).all()
    result = [schema.Tag.model_validate(db_item) for db_item in db_items]

    return result


async def get_tags(
    db_session: AsyncSession,
    *,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filters: Optional[Dict[str, Dict[str, Any]]] = None,
) -> schema.PaginatedResponse[schema.TagEx]:
    """
    Get paginated tags with filtering and sorting support.

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
                    "operator": "free_text"
                }
            }

    Returns:
        Paginated response with tags including full audit trail
    """

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    owner_user = aliased(orm.User, name='owner_user')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Build base query with joins for all audit user data and group/owner info
    base_query = (
        select(orm.Tag)
        .join(created_user, orm.Tag.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Tag.updated_by == updated_user.id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.Tag.group_id, isouter=True)
        .join(owner_user, orm.Tag.user_id == owner_user.id, isouter=True)
    )

    # Apply access control - user can see tags they own or from their groups
    access_control_condition = or_(
        orm.Tag.user_id == user_id,
        orm.Tag.group_id.in_(user_groups_subquery)
    )

    where_conditions = [access_control_condition]

    # Apply custom filters
    if filters:
        filter_conditions = _build_tag_filter_conditions(
            filters, created_user, updated_user
        )
        where_conditions.extend(filter_conditions)

    base_query = base_query.where(and_(*where_conditions))

    # Count total items (using the same filters)
    count_query = (
        select(func.count(orm.Tag.id))
        .join(created_user, orm.Tag.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Tag.updated_by == updated_user.id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.Tag.group_id, isouter=True)
        .join(owner_user, orm.Tag.user_id == owner_user.id, isouter=True)
        .where(and_(*where_conditions))
    )

    total_tags = (await db_session.execute(count_query)).scalar()

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_tag_sorting(
            base_query, sort_by, sort_direction,
            created_user=created_user,
            updated_user=updated_user
        )
    else:
        # Default sorting by name asc
        base_query = base_query.order_by(orm.Tag.name.asc())

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Modify query to include all audit user data and owner/group info
    paginated_query_with_users = (
        base_query
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
            updated_user.username.label('updated_by_username')
        )
        .limit(page_size)
        .offset(offset)
    )

    # Execute query - get tuples with tag and user/group data
    results = (await db_session.execute(paginated_query_with_users)).all()

    # Convert to schema models with complete audit trail
    items = []
    for row in results:
        tag = row[0]  # The Tag object

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

        # Determine owner based on which ID exists
        if tag.user_id:
            owned_by = schema.OwnedBy(
                id=tag.user_id,
                name=row.owner_username,
                type="user"
            )
        else:  # group_id is not null (enforced by check constraint)
            owned_by = schema.OwnedBy(
                id=row.group_id,
                name=row.group_name,
                type="group"
            )

        tag_data = {
            "id": tag.id,
            "name": tag.name,
            "bg_color": tag.bg_color,
            "fg_color": tag.fg_color,
            "description": tag.description,
            "owned_by": owned_by,
            "created_at": tag.created_at,
            "updated_at": tag.updated_at,
            "created_by": created_by,
            "updated_by": updated_by
        }

        items.append(schema.TagEx(**tag_data))

    # Calculate total pages
    total_pages = math.ceil(total_tags / page_size) if total_tags > 0 else 1

    return schema.PaginatedResponse[schema.TagEx](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages,
        total_items=total_tags
    )


async def get_tag(
        db_session: AsyncSession,
        user_id: uuid.UUID,
        tag_id: uuid.UUID
) -> schema.TagDetails:
    """
    Get a single tag with full audit trail.

    Args:
        db_session: Database session
        user_id: Current user ID (for access control)
        tag_id: ID of the tag to retrieve

    Returns:
        TagDetails with complete audit trail and ownership info

    Raises:
        NoResultFound: If tag doesn't exist
        ResourceAccessDenied: If user doesn't have permission to access the tag
    """

    # First check if the tag exists at all
    exists_stmt = select(orm.Tag.id).where(orm.Tag.id == tag_id)
    exists_result = await db_session.execute(exists_stmt)
    if not exists_result.scalar():
        raise NoResultFound(f"Tag with id {tag_id} not found")

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    owner_user = aliased(orm.User, name='owner_user')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Build query with all audit user joins and group info
    stmt = (
        select(orm.Tag)
        .join(created_user, orm.Tag.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Tag.updated_by == updated_user.id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.Tag.group_id, isouter=True)
        .join(owner_user, orm.Tag.user_id == owner_user.id, isouter=True)
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
            updated_user.username.label('updated_by_username')
        )
        .where(
            and_(
                orm.Tag.id == tag_id,
                # Access control: user can access if they own it directly or through group
                or_(
                    orm.Tag.user_id == user_id,
                    orm.Tag.group_id.in_(user_groups_subquery)
                )
            )
        )
    )

    # Execute query and get single result
    result = await db_session.execute(stmt)
    row = result.unique().first()

    # If no row returned, user doesn't have access (we know the tag exists)
    if not row:
        raise ResourceAccessDenied(f"User {user_id} does not have permission to access tag {tag_id}")

    tag = row[0]  # The Tag object

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

    # Determine owner based on which ID exists
    if tag.user_id:
        owned_by = schema.OwnedBy(
            id=tag.user_id,
            name=row.owner_username,
            type="user"
        )
    else:  # group_id is not null (enforced by check constraint)
        owned_by = schema.OwnedBy(
            id=row.group_id,
            name=row.group_name,
            type="group"
        )

    # Build the complete TagDetails object
    tag_data = {
        "id": tag.id,
        "name": tag.name,
        "bg_color": tag.bg_color,
        "fg_color": tag.fg_color,
        "description": tag.description,
        "owned_by": owned_by,
        "created_at": tag.created_at,
        "updated_at": tag.updated_at,
        "created_by": created_by,
        "updated_by": updated_by
    }

    return schema.TagDetails(**tag_data)


async def create_tag(
    db_session: AsyncSession, attrs: schema.CreateTag
) -> Tuple[schema.Tag | None, schema.Error | None]:

    db_tag = orm.Tag(**attrs.model_dump())
    db_session.add(db_tag)

    try:
        await db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    return schema.Tag.model_validate(db_tag), None


async def update_tag(
    db_session: AsyncSession, tag_id: uuid.UUID, attrs: schema.UpdateTag
) -> Tuple[schema.Tag | None, schema.Error | None]:

    stmt = select(orm.Tag).where(orm.Tag.id == tag_id)
    tag = (await db_session.execute(stmt)).scalars().one()
    db_session.add(tag)

    if attrs.name:
        tag.name = attrs.name

    if attrs.fg_color:
        tag.fg_color = attrs.fg_color

    if attrs.bg_color:
        tag.bg_color = attrs.bg_color

    if attrs.description:
        tag.description = attrs.description

    if attrs.group_id:
        tag.user_id = None
        tag.group_id = attrs.group_id
    elif attrs.user_id:
        tag.user_id = attrs.user_id
        tag.group_id = None
    else:
        raise ValueError(
            "Either attrs.user_id or attrs.group_id should be non-empty value"
        )

    try:
        await db_session.commit()
        db_tag = await db_session.get(orm.Tag, tag_id)
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    return schema.Tag.model_validate(db_tag), None


async def delete_tag(
    db_session: AsyncSession,
    tag_id: uuid.UUID,
):
    stmt = select(orm.Tag).where(orm.Tag.id == tag_id)
    try:
        tag = (await db_session.execute(stmt, params={"id": tag_id})).scalars().one()
        await db_session.delete(tag)
        await db_session.commit()
    except NoResultFound:
        raise EntityNotFound()


def _build_tag_filter_conditions(
        filters: Dict[str, Dict[str, Any]],
        created_user,
        updated_user
) -> list:
    """Build SQLAlchemy WHERE conditions from filters dictionary for tags."""
    conditions = []

    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")
        operator = filter_config.get("operator", "eq")

        if not value:
            continue

        condition = None

        if filter_name == "free_text":
            # Search across tag name and description
            search_term = f"%{value}%"
            condition = or_(
                orm.Tag.name.ilike(search_term),
                orm.Tag.description.ilike(search_term)
            )

        if condition is not None:
            conditions.append(condition)

    return conditions


def _apply_tag_sorting(
        query,
        sort_by: str,
        sort_direction: str,
        created_user,
        updated_user,
):
    """Apply sorting to the tags query."""
    sort_column = None

    # Map sort_by to actual columns
    if sort_by == "id":
        sort_column = orm.Tag.id
    elif sort_by == "name":
        sort_column = orm.Tag.name
    elif sort_by == "created_at":
        sort_column = orm.Tag.created_at
    elif sort_by == "updated_at":
        sort_column = orm.Tag.updated_at
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
