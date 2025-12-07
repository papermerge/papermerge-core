from uuid import UUID
from typing import Literal, Tuple

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from papermerge.core import orm, types
from papermerge.core.features.ownership.db.orm import Ownership
from papermerge.core.schemas.common import OwnedBy


# -----------------------------------------------------------------------------
# BASIC OWNERSHIP OPERATIONS
# -----------------------------------------------------------------------------

async def get_owner_info(
    session: AsyncSession,
    resource_type: types.ResourceType,
    resource_id: UUID
) -> Tuple[types.OwnerType, UUID] | None:
    """
    Get the owner type and ID for a resource.

    Returns:
        Tuple of (owner_type, owner_id) or None if not found
    """
    stmt = select(Ownership).where(
        Ownership.resource_type == resource_type.value,
        Ownership.resource_id == resource_id
    )
    ownership = (await session.execute(stmt)).scalar_one_or_none()

    if ownership:
        return (types.OwnerType(ownership.owner_type), ownership.owner_id)
    return None


async def get_owner_details(
    session: AsyncSession,
    resource_type: types.ResourceType,
    resource_id: UUID
) -> OwnedBy | None:
    """
    Get complete owner information including name.

    Returns OwnedBy schema with id, name, and type.
    """
    from papermerge.core.features.users.db import orm as user_orm
    from papermerge.core.features.groups.db import orm as group_orm

    stmt = select(Ownership).where(
        Ownership.resource_type == resource_type.value,
        Ownership.resource_id == resource_id
    )
    ownership = (await session.execute(stmt)).scalar_one_or_none()

    if not ownership:
        return None

    owner_type = types.OwnerType(ownership.owner_type)
    owner_id = ownership.owner_id

    # Fetch owner name based on type
    if owner_type == types.OwnerType.USER:
        user = await session.get(user_orm.User, owner_id)
        if user:
            return OwnedBy(
                id=user.id,
                name=user.username,
                type=types.OwnerType.USER
            )
    elif owner_type == types.OwnerType.GROUP:
        group = await session.get(group_orm.Group, owner_id)
        if group:
            return OwnedBy(
                id=group.id,
                name=group.name,
                type=types.OwnerType.GROUP
            )
    # Add PROJECT and WORKSPACE cases when implemented

    return None


async def set_owner(
    session: AsyncSession,
    resource: types.Resource,
    owner: types.Owner
) -> Ownership:
    """
    Set or update the owner of a resource.

    Creates ownership record if it doesn't exist, updates if it does.
    """
    stmt = select(Ownership).where(
        Ownership.resource_type == resource.type.value,
        Ownership.resource_id == resource.id
    )
    ownership = (await session.execute(stmt)).scalar_one_or_none()

    if ownership:
        # Update existing ownership
        ownership.owner_type = owner.owner_type.value
        ownership.owner_id = owner.owner_id
    else:
        # Create new ownership
        ownership = Ownership(
            owner_type=owner.owner_type.value,
            owner_id=owner.owner_id,
            resource_type=resource.type.value,
            resource_id=resource.id
        )
        session.add(ownership)

    await session.flush()
    return ownership


async def set_owners(
    session: AsyncSession,
    resource_type: types.ResourceType,
    resource_ids: list[UUID],
    owner_type: types.OwnerType,
    owner_id: UUID
) -> list[Ownership]:
    """
    Set or update the owner of multiple resources using bulk upsert.

    Creates ownership records if they don't exist, updates if they do.
    Returns a list of ownership records in the same order as resource_ids.
    """
    if not resource_ids:
        return []

    # Prepare data for bulk upsert
    values = [
        {
            "resource_type": resource_type.value,
            "resource_id": resource_id,
            "owner_type": owner_type.value,
            "owner_id": owner_id,
        }
        for resource_id in resource_ids
    ]

    # Perform PostgreSQL upsert (INSERT ... ON CONFLICT DO UPDATE)
    stmt = insert(Ownership).values(values)
    stmt = stmt.on_conflict_do_update(
        index_elements=["resource_type", "resource_id"],  # unique constraint columns
        set_={
            "owner_type": stmt.excluded.owner_type,
            "owner_id": stmt.excluded.owner_id,
        }
    ).returning(Ownership)

    result = await session.execute(stmt)
    ownerships = result.scalars().all()

    # Create a map and return in original order
    ownership_map = {o.resource_id: o for o in ownerships}
    return [ownership_map[resource_id] for resource_id in resource_ids]


async def delete_ownership(
    session: AsyncSession,
    resource_type: types.ResourceType,
    resource_id: UUID
) -> None:
    """
    Delete the ownership record for a resource.
    Should be called when the resource itself is deleted.
    """
    stmt = delete(Ownership).where(
        Ownership.resource_type == resource_type.value,
        Ownership.resource_id == resource_id
    )
    await session.execute(stmt)


# -----------------------------------------------------------------------------
# OWNERSHIP VALIDATION & CHECKING
# -----------------------------------------------------------------------------

async def has_owned_resources(
    session: AsyncSession,
    owner_type: types.OwnerType,
    owner_id: UUID
) -> bool:
    """
    Check if an owner has any resources.
    Used before allowing user/group deletion.
    """
    stmt = select(func.count(Ownership.id)).where(
        Ownership.owner_type == owner_type.value,
        Ownership.owner_id == owner_id
    )
    result = await session.execute(stmt)
    count = result.scalar_one()
    return count > 0


async def get_owned_resource_counts(
    session: AsyncSession,
    owner_type: types.OwnerType,
    owner_id: UUID
) -> dict[str, int]:
    """
    Get counts of resources owned by an owner, grouped by resource type.

    Returns:
        {'node': 10, 'tag': 5, 'custom_field': 3, 'document_type': 2}
    """
    stmt = (
        select(
            Ownership.resource_type,
            func.count(Ownership.id).label('count')
        )
        .where(
            Ownership.owner_type == owner_type.value,
            Ownership.owner_id == owner_id
        )
        .group_by(Ownership.resource_type)
    )

    result = await session.execute(stmt)
    counts = {row.resource_type: row.count for row in result}

    # Ensure all resource types are present
    for resource_type in types.ResourceType:
        if resource_type.value not in counts:
            counts[resource_type.value] = 0

    return counts


async def is_owner(
    session: AsyncSession,
    resource_type: types.ResourceType,
    resource_id: UUID,
    owner_type: types.OwnerType,
    owner_id: UUID
) -> bool:
    """
    Check if a specific owner owns a specific resource.
    """
    stmt = select(func.count(Ownership.id)).where(
        Ownership.resource_type == resource_type.value,
        Ownership.resource_id == resource_id,
        Ownership.owner_type == owner_type.value,
        Ownership.owner_id == owner_id
    )
    result = await session.execute(stmt)
    count = result.scalar_one()
    return count > 0


# -----------------------------------------------------------------------------
# UNIQUENESS CHECKING (APPLICATION LEVEL)
# -----------------------------------------------------------------------------

async def check_name_unique_for_owner(
    session: AsyncSession,
    resource_type: types.ResourceType,
    owner_type: types.OwnerType,
    owner_id: UUID,
    name: str,
    exclude_id: UUID | None = None,
    parent_id: UUID | None = None,
    ctype: str | None = None
) -> bool:
    """
    Check if a name is unique for a given owner.

    Args:
        session: Database session
        resource_type: Type of resource
        owner_type: Type of owner
        owner_id: Owner's ID
        name: Name to check
        exclude_id: ID to exclude (for updates)
        parent_id: For nodes - check uniqueness within parent folder
        ctype: For nodes - check only specific ctype ('folder' or 'document')

    Returns:
        True if name is unique, False if it already exists
    """
    from papermerge.core.features.nodes.db import orm as node_orm
    from papermerge.core.features.tags.db import orm as tag_orm
    from papermerge.core.features.custom_fields.db import orm as cf_orm
    from papermerge.core.features.document_types.db import orm as dt_orm

    # Map resource types to their ORM models and name columns
    resource_map = {
        types.ResourceType.NODE: (node_orm.Node, node_orm.Node.title),
        types.ResourceType.TAG: (tag_orm.Tag, tag_orm.Tag.name),
        types.ResourceType.CUSTOM_FIELD: (cf_orm.CustomField, cf_orm.CustomField.name),
        types.ResourceType.DOCUMENT_TYPE: (dt_orm.DocumentType, dt_orm.DocumentType.name),
    }

    if resource_type not in resource_map:
        raise ValueError(f"Unsupported resource type: {resource_type}")

    resource_table, name_column = resource_map[resource_type]

    # Build query
    stmt = (
        select(func.count())
        .select_from(Ownership)
        .join(resource_table, resource_table.id == Ownership.resource_id)
        .where(
            Ownership.owner_type == owner_type.value,
            Ownership.owner_id == owner_id,
            Ownership.resource_type == resource_type.value,
            func.lower(name_column) == func.lower(name)
        )
    )

    # For nodes, check uniqueness within parent
    if resource_type == types.ResourceType.NODE and parent_id is not None:
        stmt = stmt.where(resource_table.parent_id == parent_id)

    if resource_type == types.ResourceType.NODE and ctype is not None:
        stmt = stmt.where(resource_table.ctype == ctype)

    # Exclude current resource (for updates)
    if exclude_id:
        stmt = stmt.where(resource_table.id != exclude_id)

    result = await session.execute(stmt)
    count = result.scalar_one()

    return count == 0


# -----------------------------------------------------------------------------
# BULK OPERATIONS
# -----------------------------------------------------------------------------

async def get_resources_by_owner(
    session: AsyncSession,
    owner_type: types.OwnerType,
    owner_id: UUID,
    resource_type: types.ResourceType | None = None,
) -> list[UUID]:
    """
    Get all resource IDs owned by a specific owner.

    Args:
        resource_type: Optional filter by resource type

    Returns:
        List of resource UUIDs
    """
    stmt = select(Ownership.resource_id).where(
        Ownership.owner_type == owner_type.value,
        Ownership.owner_id == owner_id
    )

    if resource_type:
        stmt = stmt.where(Ownership.resource_type == resource_type.value)

    result = await session.execute(stmt)
    return [row[0] for row in result]


async def transfer_all_resources(
    session: AsyncSession,
    from_owner_type: types.OwnerType,
    from_owner_id: UUID,
    to_owner_type: types.OwnerType,
    to_owner_id: UUID
) -> int:
    """
    Transfer all resources from one owner to another.
    Useful when deleting a user/group and reassigning their resources.

    Returns:
        Number of resources transferred
    """
    stmt = select(Ownership).where(
        Ownership.owner_type == from_owner_type.value,
        Ownership.owner_id == from_owner_id
    )

    ownerships = (await session.execute(stmt)).scalars().all()

    for ownership in ownerships:
        ownership.owner_type = to_owner_type.value
        ownership.owner_id = to_owner_id

    await session.flush()
    return len(ownerships)


# =============================================================================
# UPDATED: papermerge/core/features/nodes/db/api.py
# =============================================================================

"""
Add these helper functions to your existing nodes API
"""

async def create_node_with_owner(
    session: AsyncSession,
    title: str,
    ctype: Literal["document", "folder"],
    owner_type: types.OwnerType,
    owner_id: UUID,
    parent_id: UUID | None = None,
    **kwargs
) -> orm.Node:
    """
    Create a node and set its owner.

    This replaces the old create_node that used user_id/group_id.
    """
    from papermerge.core.features.nodes.db import orm as node_orm
    from papermerge.core.features.ownership.db import api as ownership_api

    check_ctype = None
    if ctype == "folder":
        check_ctype = "folder"

    # Check name uniqueness
    is_unique = await ownership_api.check_name_unique_for_owner(
        session=session,
        resource_type=types.ResourceType.NODE,
        owner_type=owner_type,
        owner_id=owner_id,
        name=title,
        parent_id=parent_id,
        ctype=check_ctype
    )

    if not is_unique:
        raise ValueError(
            f"A {ctype} named '{title}' already exists in this location "
            f"for this {owner_type.value}"
        )

    # Create the node (without user_id/group_id)
    if ctype == "folder":
        node = node_orm.Folder(
            title=title,
            ctype=ctype,
            parent_id=parent_id,
            **kwargs
        )
    else:
        node = orm.Document(
            title=title,
            ctype=ctype,
            parent_id=parent_id,
            **kwargs
        )

    session.add(node)
    await session.flush()

    # Set ownership
    await ownership_api.set_owner(
        session=session,
        resource=types.NodeResource(id=node.id),
        owner=types.OwnerType(owner_type=owner_type, owner_id=owner_id),
    )

    return node


async def update_node_owner(
    session: AsyncSession,
    node_id: UUID,
    new_owner_type: types.OwnerType,
    new_owner_id: UUID
) -> None:
    """
    Transfer node ownership.

    Validates:
    - New owner exists
    - Name is unique under new owner
    """
    from papermerge.core.features.nodes.db import orm as node_orm
    from papermerge.core.features.ownership.db import api as ownership_api

    # Get the node
    node = await session.get(node_orm.Node, node_id)
    if not node:
        raise ValueError(f"Node {node_id} not found")

    # Check if name is unique under new owner
    is_unique = await ownership_api.check_name_unique_for_owner(
        session=session,
        resource_type=types.ResourceType.NODE,
        owner_type=new_owner_type,
        owner_id=new_owner_id,
        name=node.title,
        parent_id=node.parent_id,
        exclude_id=node_id
    )

    if not is_unique:
        raise ValueError(
            f"A node named '{node.title}' already exists under "
            f"the new {new_owner_type.value}"
        )

    # Update ownership
    await ownership_api.set_owner(
        session=session,
        resource_type=types.ResourceType.NODE,
        resource_id=node_id,
        owner_type=new_owner_type,
        owner_id=new_owner_id
    )


async def delete_node_with_ownership(
    session: AsyncSession,
    node_id: UUID
) -> None:
    """
    Delete a node and its ownership record.
    """
    from papermerge.core.features.nodes.db import orm as node_orm
    from papermerge.core.features.ownership.db import api as ownership_api

    # Delete ownership first
    await ownership_api.delete_ownership(
        session=session,
        resource_type=types.ResourceType.NODE,
        resource_id=node_id
    )

    # Delete the node
    stmt = delete(node_orm.Node).where(node_orm.Node.id == node_id)
    await session.execute(stmt)


async def get_nodes_for_owner(
    session: AsyncSession,
    owner_type: types.OwnerType,
    owner_id: UUID,
    parent_id: UUID | None = None,
    limit: int = 100,
    offset: int = 0
) -> list[orm.Node]:
    """
    Get all nodes owned by a specific owner.

    Replaces queries that filtered by user_id or group_id.
    """
    from papermerge.core.features.nodes.db import orm as node_orm

    stmt = (
        select(node_orm.Node)
        .join(Ownership, Ownership.resource_id == node_orm.Node.id)
        .where(
            Ownership.resource_type == types.ResourceType.NODE.value,
            Ownership.owner_type == owner_type.value,
            Ownership.owner_id == owner_id
        )
    )

    if parent_id is not None:
        stmt = stmt.where(node_orm.Node.parent_id == parent_id)

    stmt = stmt.limit(limit).offset(offset)

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def user_can_access_resource(
    session: AsyncSession,
    user_id: UUID,
    resource_type: types.ResourceType,
    resource_id: UUID
) -> bool:
    """
    Check if a user can access a resource based on ownership.

    User can access a resource if:
    1. They own it directly (owner_type = 'user' AND owner_id = user_id)
    2. It's owned by a group they belong to (owner_type = 'group' AND user is member)

    Args:
        session: Database session
        user_id: User's UUID
        resource_type: Type of resource (node, tag, custom_field, etc.)
        resource_id: Resource's UUID

    Returns:
        True if user can access, False otherwise
    """
    from papermerge.core.features.groups.db.orm import UserGroup

    # Get the resource's ownership
    stmt = select(Ownership).where(
        Ownership.resource_type == resource_type.value,
        Ownership.resource_id == resource_id
    )
    ownership = (await session.execute(stmt)).scalar_one_or_none()

    if not ownership:
        # No ownership record = no access
        return False

    # Check if user owns it directly
    if ownership.owner_type == types.OwnerType.USER.value and ownership.owner_id == user_id:
        return True

    # Check if owned by a group the user belongs to
    if ownership.owner_type == types.OwnerType.GROUP.value:
        # Check if user is an active member of the group
        stmt = (
            select(func.count())
            .select_from(UserGroup)
            .where(
                UserGroup.user_id == user_id,
                UserGroup.group_id == ownership.owner_id,
                UserGroup.deleted_at.is_(None),  # Only active memberships
            )
        )
        result = (await session.execute(stmt)).scalar()
        return result > 0

    return False


async def user_can_access_multiple_resources(
    session: AsyncSession,
    user_id: UUID,
    resource_type: types.ResourceType,
    resource_ids: list[UUID]
) -> dict[UUID, bool]:
    """
    Batch check if user can access multiple resources.

    More efficient than calling user_can_access_resource in a loop.

    Args:
        session: Database session
        user_id: User's UUID
        resource_type: Type of resources
        resource_ids: List of resource UUIDs to check

    Returns:
        Dictionary mapping resource_id -> can_access (bool)
    """
    from papermerge.core.features.groups.db.orm import UserGroup

    if not resource_ids:
        return {}

    # Get user's group IDs
    user_groups_stmt = select(UserGroup.group_id).where(
        UserGroup.user_id == user_id,
        UserGroup.deleted_at.is_(None)
    )
    user_group_ids_result = await session.execute(user_groups_stmt)
    user_group_ids = [row[0] for row in user_group_ids_result]

    # Get ownerships for all requested resources
    stmt = select(Ownership).where(
        Ownership.resource_type == resource_type.value,
        Ownership.resource_id.in_(resource_ids)
    )
    ownerships = (await session.execute(stmt)).scalars().all()

    # Build access map
    access_map = {}
    for resource_id in resource_ids:
        access_map[resource_id] = False  # Default: no access

    for ownership in ownerships:
        # Check if user has access
        has_access = (
                (ownership.owner_type == types.OwnerType.USER.value and ownership.owner_id == user_id) or
                (ownership.owner_type == types.OwnerType.GROUP.value and ownership.owner_id in user_group_ids)
        )
        access_map[ownership.resource_id] = has_access

    return access_map
