import uuid
import math
from typing import Optional, Dict, Any, Tuple

from sqlalchemy import select, func, or_, and_, case
from sqlalchemy.orm import aliased
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.exceptions import EntityNotFound
from papermerge.core import schema
from papermerge.core import orm
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.types import OwnerType, ResourceType, TagResource, Owner
from papermerge.core.features.ownership.db.orm import Ownership


async def get_tags_without_pagination(
    db_session: AsyncSession,
    owner: schema.Owner,
) -> list[orm.Tag]:
    stmt = (
        select(orm.Tag)
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.TAG.value,
                orm.Ownership.resource_id == orm.Tag.id
            )
        )
        .where(
            orm.Ownership.owner_type == owner.owner_type,
            orm.Ownership.owner_id == owner.owner_id
        )
        .order_by(orm.Tag.name.asc())
    )

    db_items = (await db_session.scalars(stmt)).all()
    return db_items

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
    owner_group = aliased(orm.Group, name='owner_group')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Build base query with ownership join
    base_query = (
        select(orm.Tag)
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.TAG.value,
                Ownership.resource_id == orm.Tag.id
            )
        )
        .join(created_user, orm.Tag.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Tag.updated_by == updated_user.id, isouter=True)
        # Join to owner_user when owner is a user
        .join(
            owner_user,
            and_(
                Ownership.owner_type == 'user',
                Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        # Join to owner_group when owner is a group
        .join(
            owner_group,
            and_(
                Ownership.owner_type == 'group',
                Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
    )

    # Apply access control - user can see tags they own or from their groups
    access_control_condition = or_(
        and_(
            Ownership.owner_type == OwnerType.USER.value,
            Ownership.owner_id == user_id
        ),
        and_(
            Ownership.owner_type == OwnerType.GROUP.value,
            Ownership.owner_id.in_(user_groups_subquery)
        )
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
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.TAG.value,
                Ownership.resource_id == orm.Tag.id
            )
        )
        .join(created_user, orm.Tag.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Tag.updated_by == updated_user.id, isouter=True)
        .join(
            owner_user,
            and_(
                Ownership.owner_type == 'user',
                Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        .join(
            owner_group,
            and_(
                Ownership.owner_type == 'group',
                Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
        .where(and_(*where_conditions))
    )

    total_tags = (await db_session.execute(count_query)).scalar()

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_tag_sorting(
            base_query, sort_by, sort_direction,
            created_user=created_user,
            updated_user=updated_user,
            owner_user=owner_user,
            owner_group=owner_group
        )
    else:
        # Default sorting by name asc
        base_query = base_query.order_by(orm.Tag.name.asc())

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Modify query to include all audit user data and owner info
    paginated_query_with_users = (
        base_query
        .add_columns(
            # Ownership info
            Ownership.owner_type,
            Ownership.owner_id,
            # Owner user info (if owner is user)
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            # Owner group info (if owner is group)
            owner_group.id.label('owner_group_id'),
            owner_group.name.label('owner_group_name'),
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

        # Build owned_by from ownership data
        if row.owner_type == 'user':
            owned_by = schema.OwnedBy(
                id=row.owner_user_id,
                name=row.owner_username,
                type=OwnerType.USER
            )
        else:  # group
            owned_by = schema.OwnedBy(
                id=row.owner_group_id,
                name=row.owner_group_name,
                type=OwnerType.GROUP
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
    tag_id: uuid.UUID
) -> schema.TagDetails:
    """
    Get a single tag with full audit trail.

    Args:
        db_session: Database session
        tag_id: ID of the tag to retrieve

    Returns:
        TagDetails with complete audit trail and ownership info

    Raises:
        NoResultFound: If tag doesn't exist

    Note: Access control should be performed in the router layer
    """
    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    # Build query with ownership and all audit user joins
    stmt = (
        select(orm.Tag)
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.TAG.value,
                orm.Ownership.resource_id == orm.Tag.id
            )
        )
        .join(created_user, orm.Tag.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Tag.updated_by == updated_user.id, isouter=True)
        # Join to owner_user when owner is a user
        .join(
            owner_user,
            and_(
                orm.Ownership.owner_type == 'user',
                orm.Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        # Join to owner_group when owner is a group
        .join(
            owner_group,
            and_(
                orm.Ownership.owner_type == 'group',
                orm.Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
        .add_columns(
            # Ownership info
            orm.Ownership.owner_type,
            orm.Ownership.owner_id,
            # Owner user info (if owner is user)
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            # Owner group info (if owner is group)
            owner_group.id.label('owner_group_id'),
            owner_group.name.label('owner_group_name'),
            # Created by user
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            # Updated by user
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username')
        )
        .where(orm.Tag.id == tag_id)
    )

    # Execute query and get single result
    result = await db_session.execute(stmt)
    row = result.first()

    if not row:
        raise NoResultFound(f"Tag with id {tag_id} not found")

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

    # Build owned_by from ownership data
    if row.owner_type == 'user':
        owned_by = schema.OwnedBy(
            id=row.owner_user_id,
            name=row.owner_username,
            type=OwnerType.USER
        )
    else:  # group
        owned_by = schema.OwnedBy(
            id=row.owner_group_id,
            name=row.owner_group_name,
            type=OwnerType.GROUP
        )

    # Build the complete TagDetails object
    return schema.TagDetails(
        id=tag.id,
        name=tag.name,
        bg_color=tag.bg_color,
        fg_color=tag.fg_color,
        description=tag.description,
        owned_by=owned_by,
        created_at=tag.created_at,
        updated_at=tag.updated_at,
        created_by=created_by,
        updated_by=updated_by
    )


async def create_tag(
    db_session: AsyncSession,
    attrs: schema.CreateTag
) -> Tuple[schema.Tag | None, schema.Error | None]:
    # Validate owner info is provided
    if not attrs.owner_type or not attrs.owner_id:
        error = schema.Error(messages=["owner_type and owner_id are required"])
        return None, error

    owner_type = OwnerType(attrs.owner_type)
    owner_id = attrs.owner_id

    # Check name uniqueness
    is_unique = await ownership_api.check_name_unique_for_owner(
        session=db_session,
        resource_type=ResourceType.TAG,
        owner_type=owner_type,
        owner_id=owner_id,
        name=attrs.name
    )

    if not is_unique:
        error = schema.Error(
            messages=[f"A tag named '{attrs.name}' already exists for this {owner_type.value}"]
        )
        return None, error

    # Create tag WITHOUT owner fields
    db_tag = orm.Tag(
        name=attrs.name,
        bg_color=attrs.bg_color,
        fg_color=attrs.fg_color,
        pinned=attrs.pinned if hasattr(attrs, 'pinned') else False,
        description=attrs.description if hasattr(attrs, 'description') else None,
    )

    db_session.add(db_tag)

    try:
        await db_session.flush()

        # Set ownership
        await ownership_api.set_owner(
            session=db_session,
            resource=TagResource(id=db_tag.id),
            owner=Owner(owner_type=owner_type, owner_id=owner_id)
        )

        await db_session.commit()
        await db_session.refresh(db_tag)

    except Exception as e:
        await db_session.rollback()
        error = schema.Error(messages=[str(e)])
        return None, error

    # Get owner details for response
    owned_by = await ownership_api.get_owner_details(
        session=db_session,
        resource_type=ResourceType.TAG,
        resource_id=db_tag.id
    )

    # Build Pydantic response
    tag = schema.Tag(
        id=db_tag.id,
        name=db_tag.name,
        bg_color=db_tag.bg_color,
        fg_color=db_tag.fg_color,
        pinned=db_tag.pinned,
        description=db_tag.description,
        owned_by=owned_by,
    )

    return tag, None


async def update_tag(
    db_session: AsyncSession,
    tag_id: uuid.UUID,
    attrs: schema.UpdateTag
) -> Tuple[schema.Tag | None, schema.Error | None]:

    stmt = select(orm.Tag).where(orm.Tag.id == tag_id)
    tag = (await db_session.execute(stmt)).scalar_one_or_none()

    if not tag:
        error = schema.Error(messages=[f"Tag with id {tag_id} not found"])
        return None, error

    # Update basic fields
    if attrs.name is not None:
        # If changing ownership, check uniqueness under new owner
        if attrs.owner_type and attrs.owner_id:
            owner_type = attrs.owner_type
            owner_id = attrs.owner_id
        else:
            # Get current owner for uniqueness check
            current_owner = await ownership_api.get_owner_info(
                session=db_session,
                resource_type=ResourceType.TAG,
                resource_id=tag_id
            )
            if current_owner:
                owner_type, owner_id = current_owner
            else:
                error = schema.Error(messages=[f"No owner found for tag {tag_id}"])
                return None, error

        # Check name uniqueness
        is_unique = await ownership_api.check_name_unique_for_owner(
            session=db_session,
            resource_type=ResourceType.TAG,
            owner_type=owner_type,
            owner_id=owner_id,
            name=attrs.name,
            exclude_id=tag_id
        )

        if not is_unique:
            error = schema.Error(
                messages=[f"A tag named '{attrs.name}' already exists for this {owner_type.value}"]
            )
            return None, error

        tag.name = attrs.name

    if attrs.fg_color is not None:
        tag.fg_color = attrs.fg_color

    if attrs.bg_color is not None:
        tag.bg_color = attrs.bg_color

    if attrs.description is not None:
        tag.description = attrs.description

    if attrs.pinned is not None:
        tag.pinned = attrs.pinned

    # Handle ownership transfer
    if attrs.owner_type is not None and attrs.owner_id is not None:
        # Check name uniqueness under new owner (if name wasn't changed above)
        if attrs.name is None:
            is_unique = await ownership_api.check_name_unique_for_owner(
                session=db_session,
                resource_type=ResourceType.TAG,
                owner_type=attrs.owner_type,
                owner_id=attrs.owner_id,
                name=tag.name,
                exclude_id=tag_id
            )

            if not is_unique:
                error = schema.Error(
                    messages=[f"A tag named '{tag.name}' already exists for the target {attrs.owner_type.value}"]
                )
                return None, error

        # Update ownership
        await ownership_api.set_owner(
            session=db_session,
            resource=TagResource(id=tag_id),
            owner=Owner(owner_type=attrs.owner_type, owner_id=attrs.owner_id)
        )

    try:
        db_session.add(tag)
        await db_session.commit()
        await db_session.refresh(tag)
    except Exception as e:
        await db_session.rollback()
        error = schema.Error(messages=[str(e)])
        return None, error

    # Get owner details for response
    owned_by = await ownership_api.get_owner_details(
        session=db_session,
        resource_type=ResourceType.TAG,
        resource_id=tag_id
    )

    # Build Pydantic response
    tag_response = schema.Tag(
        id=tag.id,
        name=tag.name,
        bg_color=tag.bg_color,
        fg_color=tag.fg_color,
        pinned=tag.pinned,
        description=tag.description,
        owned_by=owned_by,
        created_at=tag.created_at,
        updated_at=tag.updated_at,
    )

    return tag_response, None

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
        owner_user,
        owner_group
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
    sort_column = case(
        (orm.Ownership.owner_type == OwnerType.USER, owner_user.username),
        (orm.Ownership.owner_type == OwnerType.GROUP, owner_group.name),
        else_=None
    )

    if sort_column is not None:
        if sort_direction.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    return query
