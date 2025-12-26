import logging
import math
import uuid
from typing import Optional, Dict, Any

from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.special_folders.db import \
    api as special_folders_api
from papermerge.core.types import OwnerType
from papermerge.core import schema, orm

logger = logging.getLogger(__name__)


async def get_group(db_session: AsyncSession, group_id: uuid.UUID) -> schema.GroupDetails:
    """
    Get a single group by ID with full audit trail information.

    Args:
        db_session: Database session
        group_id: UUID of the group to retrieve

    Returns:
        GroupDetails with audit trail information

    Raises:
        NoResultFound: If group doesn't exist
    """

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')

    # Build query with joins for all audit user data
    query = (
        select(orm.Group)
        .join(created_user, orm.Group.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Group.updated_by == updated_user.id, isouter=True)
        .where(orm.Group.id == group_id)
        .add_columns(
            # Created by user
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            # Updated by user
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username'),
        )
    )

    # Execute query
    result = (await db_session.execute(query)).one()
    group = result[0]  # The Group object

    # Build audit user objects (handle None values)
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

    # Create GroupDetails with all data
    group_data = {
        "id": group.id,
        "name": group.name,
        "home_folder_id": group.home_folder_id,
        "inbox_folder_id": group.inbox_folder_id,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "created_by": created_by,
        "updated_by": updated_by,
    }

    return schema.GroupDetails(**group_data)


async def get_groups(
        db_session: AsyncSession,
        *,
        page_size: int,
        page_number: int,
        sort_by: Optional[str] = None,
        sort_direction: Optional[str] = None,
        filters: Optional[Dict[str, Dict[str, Any]]] = None,
        include_deleted: bool = False,
        include_archived: bool = True
) -> schema.PaginatedResponse[schema.GroupEx]:
    """
    Get paginated groups with filtering and sorting support.

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
                    "operator": "in" | "like" | "eq" | "free_text" | "with_users" | "without_users"
                }
            }
        include_deleted: Whether to include soft-deleted groups
        include_archived: Whether to include archived groups

    Returns:
        Paginated response with groups including full audit trail
    """

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    deleted_user = aliased(orm.User, name='deleted_user')
    archived_user = aliased(orm.User, name='archived_user')

    # Build base query with joins for all audit user data
    base_query = (
        select(orm.Group)
        .join(created_user, orm.Group.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Group.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.Group.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.Group.archived_by == archived_user.id, isouter=True)
    )

    # Apply default visibility filters
    where_conditions = []

    if not include_deleted:
        where_conditions.append(orm.Group.deleted_at.is_(None))

    if not include_archived:
        where_conditions.append(orm.Group.archived_at.is_(None))

    # Apply custom filters
    if filters:
        filter_conditions = _build_group_filter_conditions(
            filters, created_user, updated_user, deleted_user, archived_user
        )
        where_conditions.extend(filter_conditions)

    if where_conditions:
        base_query = base_query.where(and_(*where_conditions))

    # Count total items (using the same filters)
    count_query = (
        select(func.count(orm.Group.id))
        .join(created_user, orm.Group.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Group.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.Group.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.Group.archived_by == archived_user.id, isouter=True)
    )

    # Apply group-specific filters to count query if needed
    if filters and any(f in filters for f in ['with_users', 'without_users']):
        count_query = _apply_user_filters_to_count_query(count_query, filters)

    if where_conditions:
        count_query = count_query.where(and_(*where_conditions))

    total_groups = (await db_session.execute(count_query)).scalar()

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_group_sorting(
            base_query, sort_by, sort_direction,
            created_user=created_user,
            updated_user=updated_user,
            deleted_user=deleted_user,
            archived_user=archived_user
        )
    else:
        # Default sorting by created_at desc
        base_query = base_query.order_by(orm.Group.created_at.desc())

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

    # Execute query - get tuples with group and user data
    results = (await db_session.execute(paginated_query_with_users)).all()

    # Convert to schema models with complete audit trail
    items = []
    for row in results:
        group = row[0]  # The Group object

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

        group_data = {
            "id": group.id,
            "name": group.name,
            "delete_me": group.delete_me,
            "home_folder_id": group.home_folder_id,
            "inbox_folder_id": group.inbox_folder_id,
            "created_at": group.created_at,
            "updated_at": group.updated_at,
            "deleted_at": group.deleted_at,
            "archived_at": group.archived_at,
            "created_by": created_by,
            "updated_by": updated_by,
            "deleted_by": deleted_by,
            "archived_by": archived_by
        }

        items.append(schema.GroupEx(**group_data))

    # Calculate total pages
    total_pages = math.ceil(total_groups / page_size) if total_groups > 0 else 1

    return schema.PaginatedResponse[schema.GroupEx](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages,
        total_items=total_groups
    )



def _build_group_filter_conditions(
    filters: Dict[str, Dict[str, Any]],
    created_user,
    updated_user,
    deleted_user,
    archived_user
) -> list:
    """Build SQLAlchemy WHERE conditions from filters dictionary for groups."""
    conditions = []

    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")
        operator = filter_config.get("operator", "eq")

        if not value:
            continue

        condition = None

        if filter_name == "with_users":
            if operator == "in" and isinstance(value, list):
                user_ids_subquery = (
                    select(orm.User.id)
                    .where(orm.User.username.in_(value))
                )
                subquery = (
                    select(orm.UserGroup.group_id)
                    .where(orm.UserGroup.user_id.in_(user_ids_subquery))
                )
                condition = orm.Group.id.in_(subquery)

        elif filter_name == "without_users":
            if operator == "in" and isinstance(value, list):
                user_ids_subquery = (
                    select(orm.User.id)
                    .where(orm.User.username.in_(value))
                )
                subquery = (
                    select(orm.UserGroup.group_id)
                    .where(orm.UserGroup.user_id.in_(user_ids_subquery))
                )
                condition = ~orm.Group.id.in_(subquery)

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
                orm.Group.name.ilike(search_term),
                created_user.username.ilike(search_term),
                updated_user.username.ilike(search_term),
                created_user.first_name.ilike(search_term),
                created_user.last_name.ilike(search_term),
                updated_user.first_name.ilike(search_term),
                updated_user.last_name.ilike(search_term),
            )

        elif filter_name == "name":
            if operator == "like":
                condition = orm.Group.name.ilike(f"%{value}%")
            elif operator == "eq":
                condition = orm.Group.name == value
            elif operator == "in" and isinstance(value, list):
                condition = orm.Group.name.in_(value)

        # Add more filter conditions as needed

        if condition is not None:
            conditions.append(condition)

    return conditions



async def get_groups_without_pagination(db_session: AsyncSession) -> list[schema.Group]:
    stmt = select(orm.Group).where(
        orm.Group.archived_at.is_(None),
        orm.Group.deleted_at.is_(None),
    ).order_by(orm.Group.name.asc())

    db_groups = (await db_session.scalars(stmt)).all()
    items = [schema.Group.model_validate(db_group) for db_group in db_groups]

    return items


async def create_group(
    db_session: AsyncSession,
    name: str,
    created_by: uuid.UUID,
    with_special_folders: bool = False,
    exists_ok: bool = False,
) -> schema.Group:
    """
    Create a new group, optionally with special folders.

    REMOVED: No longer requires SET CONSTRAINTS ALL DEFERRED
    """
    if exists_ok:
        stmt = select(orm.Group).where(orm.Group.name == name)
        result = (await db_session.execute(stmt)).scalars().all()
        if len(result) >= 1:
            logger.info(f"Group {name} already exists")
            return schema.Group.model_validate(result[0])

    group_id = uuid.uuid4()

    # REMOVED: await db_session.execute(text("SET CONSTRAINTS ALL DEFERRED"))

    # Step 1: Create group first
    group = orm.Group(
        id=group_id,
        name=name,
        created_by=created_by,
        updated_by=created_by,
    )
    db_session.add(group)
    await db_session.flush()

    # Step 2: Create special folders if requested
    if with_special_folders:
        await special_folders_api.create_special_folders_for_group(
            db_session,
            group_id
        )

    await db_session.commit()
    await db_session.refresh(group)

    result = schema.Group.model_validate(group)
    return result


async def update_group(
    db_session: AsyncSession,
    group_id: uuid.UUID,
    attrs: schema.UpdateGroup
) -> schema.Group:
    """
    Update group properties.

    Handles special folder creation/deletion based on with_special_folders flag.
    """
    stmt = select(orm.Group).where(orm.Group.id == group_id)
    group = (await db_session.execute(stmt)).scalars().one()

    # Update name if provided
    if attrs.name is not None:
        group.name = attrs.name

    # Handle special folders changes
    if attrs.with_special_folders is not None:
        current_has_folders = await special_folders_api.has_special_folders(
            db_session,
            OwnerType.GROUP,
            group_id
        )

        if attrs.with_special_folders and not current_has_folders:
            # User wants special folders, but group doesn't have them yet
            await special_folders_api.create_special_folders_for_group(
                db_session,
                group_id
            )
        elif not attrs.with_special_folders and current_has_folders:
            # User wants to remove special folders
            await special_folders_api.delete_special_folders_for_group(
                db_session,
                group_id
            )

    await db_session.commit()
    await db_session.refresh(group)

    result = schema.Group.model_validate(group)
    return result


async def delete_group(
    db_session: AsyncSession,
    group_id: uuid.UUID,
):
    stmt = select(orm.Group).where(orm.Group.id == group_id)
    group = (await db_session.execute(stmt, params={"id": group_id})).scalars().one()
    await db_session.delete(group)
    await db_session.commit()


def _apply_user_filters_to_count_query(count_query, filters):
    """Apply user-related filters to the count query."""
    for filter_name, filter_config in filters.items():
        if filter_name in ['with_users', 'without_users']:
            operator = filter_config.get("operator")
            value = filter_config.get("value")

            if filter_name == "with_users" and operator == "in":
                # First get user IDs from usernames, then check users_groups table
                user_ids_subquery = (
                    select(orm.User.id)
                    .where(orm.User.username.in_(value))
                )
                subquery = (
                    select(orm.UserGroup.group_id)
                    .where(orm.UserGroup.user_id.in_(user_ids_subquery))
                )
                count_query = count_query.where(orm.Group.id.in_(subquery))

            elif filter_name == "without_users" and operator == "in":
                # First get user IDs from usernames, then check users_groups table
                user_ids_subquery = (
                    select(orm.User.id)
                    .where(orm.User.username.in_(value))
                )
                subquery = (
                    select(orm.UserGroup.group_id)
                    .where(orm.UserGroup.user_id.in_(user_ids_subquery))
                )
                count_query = count_query.where(~orm.Group.id.in_(subquery))

    return count_query


def _apply_group_sorting(
        query,
        sort_by: str,
        sort_direction: str,
        created_user,
        updated_user,
        deleted_user,
        archived_user,
):
    """Apply sorting to the groups query."""
    sort_column = None
    # Map sort_by to actual columns
    if sort_by == "id":
        sort_column = orm.Group.id
    elif sort_by == "name":
        sort_column = orm.Group.name
    elif sort_by == "created_at":
        sort_column = orm.Group.created_at
    elif sort_by == "updated_at":
        sort_column = orm.Group.updated_at
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
