from typing import Tuple, Sequence
import math
import uuid
from typing import Union
from uuid import UUID

from sqlalchemy import delete, tuple_
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, selectin_polymorphic, aliased

from papermerge.core.features.nodes.db.orm import Folder
from papermerge.core.features.ownership.db.orm import Ownership
from papermerge.core.features.shared_nodes import schema as sn_schema
from papermerge.core.features.shared_nodes.db import orm as sn_orm
from papermerge.core.types import PaginatedResponse
from papermerge.core import dbapi
from papermerge.core.db import common as dbapi_common
from papermerge.core import orm, schema
from papermerge.core.schemas.common import PaginatedResponse
from papermerge.core.types import ResourceType, OwnerType


def str2colexpr(keys: list[str]):
    result = []
    ORDER_BY_MAP = {
        "ctype": orm.Node.ctype,
        "-ctype": orm.Node.ctype.desc(),
        "title": orm.Node.title,
        "-title": orm.Node.title.desc(),
        "created_at": orm.Node.created_at,
        "-created_at": orm.Node.created_at.desc(),
        "updated_at": orm.Node.updated_at,
        "-updated_at": orm.Node.updated_at.desc(),
    }

    for key in keys:
        item = ORDER_BY_MAP.get(key, orm.Node.title)
        result.append(item)

    return result


async def create_shared_nodes(
    db_session: AsyncSession,
    node_ids: list[uuid.UUID],
    role_ids: list[uuid.UUID],
    owner_id: uuid.UUID,
    created_by: uuid.UUID,
    user_ids: list[uuid.UUID] | None = None,
    group_ids: list[uuid.UUID] | None = None,
) -> Tuple[list[sn_schema.SharedNode] | None, str | None]:
    if user_ids is None:
        user_ids = []

    if group_ids is None:
        group_ids = []

    shared_nodes = []
    for node_id in node_ids:
        for user_id in user_ids:
            for role_id in role_ids:
                shared_nodes.append(
                    sn_orm.SharedNode(
                        node_id=node_id,
                        user_id=user_id,
                        role_id=role_id,
                        group_id=None,
                        owner_id=owner_id,
                        created_by=created_by,
                        updated_by=created_by
                    )
                )
        for group_id in group_ids:
            for role_id in role_ids:
                shared_nodes.append(
                    sn_orm.SharedNode(
                        node_id=node_id,
                        user_id=None,
                        role_id=role_id,
                        group_id=group_id,
                        owner_id=owner_id,
                        created_by=created_by,
                        updated_by=created_by,
                    )
                )

    db_session.add_all(shared_nodes)
    await db_session.commit()

    return shared_nodes, None


async def get_paginated_shared_nodes(
    db_session: AsyncSession,
    user_id: UUID,
    page_size: int,
    page_number: int,
    sort_by: str | None = None,
    sort_direction: str | None = None,
    filters: dict | None = None,
    include_deleted: bool = False,
) -> PaginatedResponse[Union[schema.DocumentEx, schema.FolderEx]]:
    """
    Get paginated shared nodes with filtering, sorting, and audit trail support.

    Args:
        db_session: Database session
        user_id: Current user ID (to find nodes shared with this user)
        page_size: Number of items per page
        page_number: Page number (1-based)
        sort_by: Column to sort by
        sort_direction: Sort direction ('asc' or 'desc')
        filters: Dictionary of filters with format:
            {
                "filter_name": {
                    "value": filter_value,
                    "operator": "free_text" | "in" | "eq" | etc.
                }
            }
        include_deleted: Whether to include soft-deleted nodes

    Returns:
        Paginated response with shared nodes including full audit trail and ownership
    """
    loader_opt = selectin_polymorphic(orm.Node, [Folder, orm.Document])

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    # Subquery for groups the user belongs to
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Permissions query for shared nodes
    perms_query = (
        select(orm.Node.id.label("node_id"), orm.Permission.codename)
        .select_from(orm.SharedNode)
        .join(orm.Node, orm.Node.id == orm.SharedNode.node_id)
        .join(orm.Role, orm.Role.id == orm.SharedNode.role_id)
        .join(
            orm.roles_permissions_association,
            orm.roles_permissions_association.c.role_id == orm.Role.id
        )
        .join(
            orm.Permission,
            orm.Permission.id == orm.roles_permissions_association.c.permission_id
        )
        .where(
            or_(
                orm.SharedNode.user_id == user_id,
                orm.SharedNode.group_id.in_(user_groups_subquery),
            )
        )
    )

    # Build base query with ownership and audit user joins
    base_query = (
        select(orm.Node)
        .select_from(orm.SharedNode)
        .options(selectinload(orm.Node.tags))
        .join(orm.Node, orm.Node.id == orm.SharedNode.node_id)
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.NODE.value,
                Ownership.resource_id == orm.Node.id
            )
        )
        .join(created_user, orm.Node.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Node.updated_by == updated_user.id, isouter=True)
        .join(
            owner_user,
            and_(
                Ownership.owner_type == OwnerType.USER.value,
                Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        .join(
            owner_group,
            and_(
                Ownership.owner_type == OwnerType.GROUP.value,
                Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
        .where(
            or_(
                orm.SharedNode.user_id == user_id,
                orm.SharedNode.group_id.in_(user_groups_subquery),
            )
        )
    )

    # Build where conditions
    where_conditions = []

    # Exclude deleted entries unless explicitly requested
    if not include_deleted:
        where_conditions.append(orm.Node.deleted_at.is_(None))

    # Apply filters
    if filters:
        filter_conditions = _build_shared_node_filter_conditions(
            filters, created_user, updated_user, owner_user, owner_group
        )
        where_conditions.extend(filter_conditions)

    if where_conditions:
        base_query = base_query.where(and_(*where_conditions))

    # Count total items (with same filters)
    count_where_conditions = [
        or_(
            orm.SharedNode.user_id == user_id,
            orm.SharedNode.group_id.in_(user_groups_subquery),
        )
    ]
    count_where_conditions.extend(where_conditions)

    count_query = (
        select(func.count(orm.Node.id))
        .select_from(orm.SharedNode)
        .join(orm.Node, orm.Node.id == orm.SharedNode.node_id)
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.NODE.value,
                Ownership.resource_id == orm.Node.id
            )
        )
        .join(created_user, orm.Node.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Node.updated_by == updated_user.id, isouter=True)
        .where(and_(*count_where_conditions))
    )

    total_nodes = await db_session.scalar(count_query)

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_shared_node_sorting(
            base_query, sort_by, sort_direction,
            created_user=created_user,
            updated_user=updated_user,
            owner_user=owner_user,
            owner_group=owner_group
        )
    else:
        # Default sorting by ctype then title
        base_query = base_query.order_by(orm.Node.ctype, orm.Node.title)

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Add columns for audit users and ownership
    paginated_query = (
        base_query
        .add_columns(
            Ownership.owner_type.label('owner_type'),
            Ownership.owner_id.label('owner_id'),
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            owner_group.id.label('owner_group_id'),
            owner_group.name.label('owner_group_name'),
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username'),
        )
        .limit(page_size)
        .offset(offset)
        .options(loader_opt)
    )

    # Execute permissions query and build permissions dict
    perms = {}
    for row in await db_session.execute(perms_query):
        if perms.get(row.node_id):
            perms[row.node_id].append(row.codename)
        else:
            perms[row.node_id] = [row.codename]

    # Execute main query
    results = (await db_session.execute(paginated_query)).all()

    # Convert to schema models with complete audit trail
    items = []
    num_pages = math.ceil(total_nodes / page_size) if total_nodes > 0 else 1

    for row in results:
        node = row[0]

        # Build audit user objects
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
        if row.owner_type == OwnerType.USER.value:
            owned_by = schema.OwnedBy(
                id=row.owner_user_id,
                name=row.owner_username,
                type=OwnerType.USER
            )
        else:
            owned_by = schema.OwnedBy(
                id=row.owner_group_id,
                name=row.owner_group_name,
                type=OwnerType.GROUP
            )

        # Get permissions for this node
        node_perms = perms.get(node.id, [])

        if node.ctype == "folder":
            item = schema.FolderEx(
                id=node.id,
                title=node.title,
                ctype=node.ctype,
                tags=node.tags,
                parent_id=node.parent_id,
                is_shared=True,  # Always true for shared nodes
                owned_by=owned_by,
                created_at=node.created_at,
                updated_at=node.updated_at,
                created_by=created_by,
                updated_by=updated_by,
            )
        else:
            item = schema.DocumentEx(
                id=node.id,
                title=node.title,
                ctype=node.ctype,
                tags=node.tags,
                parent_id=node.parent_id,
                is_shared=True,  # Always true for shared nodes
                owned_by=owned_by,
                created_at=node.created_at,
                updated_at=node.updated_at,
                created_by=created_by,
                updated_by=updated_by,
                preview_status=node.preview_status,
                ocr=node.ocr,
                ocr_status=node.ocr_status,
            )

        # Attach permissions to item
        item.perms = node_perms
        items.append(item)

    return PaginatedResponse[Union[schema.DocumentEx, schema.FolderEx]](
        page_size=page_size,
        page_number=page_number,
        num_pages=num_pages,
        items=items,
    )


async def get_shared_node_ids(
    db_session: AsyncSession,
    user_id: uuid.UUID,
) -> Sequence[uuid.UUID]:
    subquery = (select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id)
    )

    stmt = (
        select(orm.Node.id)
        .select_from(orm.SharedNode)
        .join(orm.Node, orm.Node.id == orm.SharedNode.node_id)
        .where(
            or_(
                orm.SharedNode.user_id == user_id,
                orm.SharedNode.group_id.in_(subquery),
            )
        )
    )

    ids = (await db_session.scalars(stmt)).all()

    return ids


async def get_shared_node_access_details(
    db_session: AsyncSession, node_id: uuid.UUID
) -> schema.SharedNodeAccessDetails:
    results = schema.SharedNodeAccessDetails(id=node_id)

    stmt = (
        select(
            orm.SharedNode.user_id,
            orm.User.username,
            orm.SharedNode.group_id,
            orm.Group.name.label("group_name"),
            orm.SharedNode.role_id,
            orm.Role.name.label("role_name"),
        )
        .join(orm.User, orm.User.id == orm.SharedNode.user_id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.SharedNode.group_id, isouter=True)
        .join(orm.Role, orm.Role.id == orm.SharedNode.role_id)
        .where(orm.SharedNode.node_id == node_id)
    )

    users = {}
    groups = {}
    for row in await db_session.execute(stmt):
        if row.user_id is not None:
            if (user := users.get(row.user_id)) is not None:
                user.roles.append(sn_schema.Role(name=row.role_name, id=row.role_id))
            else:
                role = sn_schema.Role(name=row.role_name, id=row.role_id)
                users[row.user_id] = sn_schema.User(
                    id=row.user_id, username=row.username, roles=[role]
                )
        if row.group_id is not None:
            if (group := groups.get(row.group_id)) is not None:
                group.roles.append(sn_schema.Role(name=row.role_name, id=row.role_id))
            else:
                role = sn_schema.Role(name=row.role_name, id=row.role_id)
                groups[row.group_id] = sn_schema.Group(
                    id=row.group_id, name=row.group_name, roles=[role]
                )

    for user_id, user in users.items():
        results.users.append(
            sn_schema.User(
                id=user_id, username=user.username, roles=list(set(user.roles))
            )
        )

    for group_id, group in groups.items():
        results.groups.append(
            sn_schema.Group(id=group_id, name=group.name, roles=list(set(group.roles)))
        )

    return results


async def update_shared_node_access(
    db_session: AsyncSession,
    node_id: uuid.UUID,
    access_update: schema.SharedNodeAccessUpdate,
    owner_id: uuid.UUID,
):
    """
    Update shared nodes access

    More appropriate name for this would be "sync" - because this is
    exactly what it does - it actually syncs content in `access_update` for
    specific node_id to match data in `shared_nodes` table.
    """

    new_user_role_pairs = []
    new_group_role_pairs = []
    for user in access_update.users:
        for role_id in user.role_ids:
            new_user_role_pairs.append((user.id, role_id))

    for group in access_update.groups:
        for role_id in group.role_ids:
            new_group_role_pairs.append((group.id, role_id))

    existing_user_role_pairs = (await db_session.execute(
        select(orm.SharedNode.user_id, orm.SharedNode.role_id).where(
            orm.SharedNode.node_id == node_id
        )
    )).all()
    existing_group_role_pairs = (await db_session.execute(
        select(orm.SharedNode.group_id, orm.SharedNode.role_id).where(
            orm.SharedNode.node_id == node_id
        )
    )).all()

    existing_user_set = set(existing_user_role_pairs)
    desired_user_set = set(new_user_role_pairs)
    existing_group_set = set(existing_group_role_pairs)
    desired_group_set = set(new_group_role_pairs)

    to_add_users = desired_user_set - existing_user_set
    to_remove_users = existing_user_set - desired_user_set
    to_add_groups = desired_group_set - existing_group_set
    to_remove_groups = existing_group_set - desired_group_set

    # Delete removed user pairs
    if to_remove_users:
        await db_session.execute(
            delete(orm.SharedNode).where(
                orm.SharedNode.node_id == node_id,
                tuple_(orm.SharedNode.user_id, orm.SharedNode.role_id).in_(
                    to_remove_users
                ),
            )
        )

    # Delete removed group pairs
    if to_remove_groups:
        await db_session.execute(
            delete(orm.SharedNode).where(
                orm.SharedNode.node_id == node_id,
                tuple_(orm.SharedNode.group_id, orm.SharedNode.role_id).in_(
                    to_remove_groups
                ),
            )
        )

    for user_id, role_id in to_add_users:
        shared = orm.SharedNode(
            node_id=node_id, user_id=user_id, role_id=role_id, owner_id=owner_id
        )
        db_session.add(shared)

    for group_id, role_id in to_add_groups:
        shared = orm.SharedNode(
            node_id=node_id, group_id=group_id, role_id=role_id, owner_id=owner_id
        )
        db_session.add(shared)

    await db_session.commit()


async def get_shared_folder(
    db_session: AsyncSession, folder_id: uuid.UUID, shared_root_id: uuid.UUID
) -> Tuple[orm.Folder | None, schema.Error | None]:
    breadcrumb = await dbapi_common.get_ancestors(db_session, folder_id)
    shorted_breadcrumb = []
    # user will see path only until its ancestor which is marked as shared root
    for b in reversed(breadcrumb):
        shorted_breadcrumb.append(b)
        if b[0] == shared_root_id:
            break

    shorted_breadcrumb.reverse()
    stmt = select(orm.Folder).where(orm.Folder.id == folder_id)
    try:
        db_model = (await db_session.scalars(stmt)).one()
        db_model.breadcrumb = shorted_breadcrumb
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    return db_model, None


async def get_shared_doc(
    db_session: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    shared_root_id: uuid.UUID | None = None,
) -> schema.Document:
    db_doc = await dbapi.load_doc(db_session, document_id)
    breadcrumb = await dbapi_common.get_ancestors(db_session, document_id)
    root_shared_node_ids = await get_shared_node_ids(db_session, user_id=user_id)
    shorted_breadcrumb = []
    # user will see path only until its ancestor which is marked as shared root

    for b in reversed(breadcrumb):
        shorted_breadcrumb.append(b)
        if shared_root_id and b[0] == shared_root_id:
            break
        if shared_root_id is None and b[0] in root_shared_node_ids:
            break

    owner = await dbapi_common.get_node_owner(db_session, node_id=document_id)
    shorted_breadcrumb.reverse()

    db_doc.breadcrumb = shorted_breadcrumb
    db_doc.owner_name = owner.name

    # colored_tags = session.scalars(colored_tags_stmt).all()
    # db_doc.tags = [ct.tag for ct in colored_tags]

    model_doc = schema.Document.model_validate(db_doc)

    return model_doc


def _build_shared_node_filter_conditions(
    filters: dict,
    created_user,
    updated_user,
    owner_user,
    owner_group
) -> list:
    """Build SQLAlchemy filter conditions from filter dict."""
    conditions = []

    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")
        operator = filter_config.get("operator", "eq")

        if filter_name == "free_text" and operator == "free_text":
            # Search in title
            conditions.append(
                func.lower(orm.Node.title).contains(
                    value.strip().lower(), autoescape=True
                )
            )
        elif filter_name == "ctype":
            if operator == "in":
                ctypes = [c.strip() for c in value.split(",")]
                conditions.append(orm.Node.ctype.in_(ctypes))
            else:
                conditions.append(orm.Node.ctype == value)
        elif filter_name == "created_by_username":
            if operator == "in":
                usernames = [u.strip() for u in value.split(",")]
                conditions.append(created_user.username.in_(usernames))
            else:
                conditions.append(created_user.username == value)
        elif filter_name == "updated_by_username":
            if operator == "in":
                usernames = [u.strip() for u in value.split(",")]
                conditions.append(updated_user.username.in_(usernames))
            else:
                conditions.append(updated_user.username == value)
        elif filter_name == "owner_name":
            conditions.append(
                or_(
                    owner_user.username.ilike(f"%{value}%"),
                    owner_group.name.ilike(f"%{value}%")
                )
            )

    return conditions


def _apply_shared_node_sorting(
    query,
    sort_by: str,
    sort_direction: str,
    created_user,
    updated_user,
    owner_user,
    owner_group
):
    """Apply sorting to the query."""
    direction = desc if sort_direction == "desc" else asc

    sort_columns = {
        "id": orm.Node.id,
        "title": orm.Node.title,
        "ctype": orm.Node.ctype,
        "created_at": orm.Node.created_at,
        "updated_at": orm.Node.updated_at,
        "created_by": created_user.username,
        "updated_by": updated_user.username,
        "owned_by": func.coalesce(owner_user.username, owner_group.name),
    }

    sort_column = sort_columns.get(sort_by, orm.Node.title)
    return query.order_by(direction(sort_column))
