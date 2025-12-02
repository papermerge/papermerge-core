from typing import List, Tuple
from uuid import UUID

from sqlalchemy import select, exists, literal, and_, or_
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.nodes.db import orm
from papermerge.core.features.shared_nodes.db import orm as sn_orm
from papermerge.core.features.roles.db import orm as roles_orm
from papermerge.core.types import OwnerType
from papermerge.core.schemas.common import OwnedBy
from papermerge.core.features.ownership.db.orm import Ownership
from papermerge.core.features.groups.db.orm import UserGroup
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.types import ResourceType


async def get_ancestors(
    db_session: AsyncSession, node_id: UUID, include_self=True
) -> List[Tuple[UUID, str]]:
    """Returns all ancestors of the node

    The most distant ancestor will be the first element in returned list.
    The most recent ancestor will be the last element in returned list.
    In other words, "home" or "inbox" folders will be first in returned list
    """
    nodes_anchor = (
        select(
            orm.Node.id, orm.Node.title, orm.Node.parent_id, literal(0).label("level")
        )
        .where(orm.Node.id == node_id)
        .cte(recursive=True, name="tree")
    )
    tree = nodes_anchor.union_all(
        select(
            orm.Node.id,
            orm.Node.title,
            orm.Node.parent_id,
            (nodes_anchor.c.level + 1).label("level"),
        ).where(nodes_anchor.c.parent_id == orm.Node.id)
    )

    stmt = (
        select(tree.c.id, tree.c.title).select_from(tree).order_by(tree.c.level.desc())
    )

    if not include_self:
        stmt = stmt.where(tree.c.id != node_id)

    result = await db_session.execute(stmt)

    return [(row.id, row.title) for row in result]

from papermerge.core.types import BreadcrumbRootType


async def get_shared_root_for_user(
    db_session: AsyncSession,
    node_id: UUID,
    user_id: UUID,
) -> UUID | None:
    """
    Find the shared root node if user is accessing a node via a share.

    Returns the ID of the topmost shared ancestor if user is accessing via share,
    or None if user is the owner (not accessing via share).
    """

    # First check if user is the owner (direct or via group)
    is_owner = await ownership_api.user_can_access_resource(
        session=db_session,
        user_id=user_id,
        resource_type=ResourceType.NODE,
        resource_id=node_id
    )

    if is_owner:
        return None  # User is owner, show full breadcrumb

    # User is accessing via share - find the shared root
    ancestors = await get_ancestors(db_session, node_id, include_self=True)
    ancestor_ids = [a[0] for a in ancestors]

    # Get groups user belongs to
    user_groups_stmt = select(UserGroup.group_id).where(UserGroup.user_id == user_id)
    user_group_ids = [row[0] for row in await db_session.execute(user_groups_stmt)]

    # Find which ancestors are shared with this user
    stmt = (
        select(sn_orm.SharedNode.node_id)
        .where(
            sn_orm.SharedNode.node_id.in_(ancestor_ids),
            or_(
                sn_orm.SharedNode.user_id == user_id,
                sn_orm.SharedNode.group_id.in_(user_group_ids),
            )
        )
    )

    shared_node_ids = set((await db_session.scalars(stmt)).all())

    if not shared_node_ids:
        return None

    # Find the topmost shared ancestor (first one in breadcrumb order)
    for ancestor_id, _ in ancestors:
        if ancestor_id in shared_node_ids:
            return ancestor_id

    return None


def truncate_breadcrumb_at_shared_root(
    breadcrumb: list[tuple[UUID, str]],
    shared_root_id: UUID
) -> list[tuple[UUID, str]]:
    """
    Truncate breadcrumb to start from the shared root.

    Given breadcrumb: [home, Projects, Flights 001, doc1.pdf]
    And shared_root_id pointing to "Flights 001"
    Returns: [Flights 001, doc1.pdf]
    """
    result = []
    found_root = False
    for item in breadcrumb:
        if item[0] == shared_root_id:
            found_root = True
        if found_root:
            result.append(item)
    return result


async def get_breadcrumb_root_type(
    db_session: AsyncSession,
    breadcrumb: list[tuple[UUID, str]],
    shared_root_id: UUID | None,
) -> BreadcrumbRootType:
    """
    Determine the root type of a breadcrumb for frontend rendering.

    Returns:
        - SHARED if user is accessing via share
        - HOME if root folder is a home folder
        - INBOX if root folder is an inbox folder
    """
    from papermerge.core.features.special_folders.db.orm import SpecialFolder
    from papermerge.core.types import FolderType

    if shared_root_id is not None:
        return BreadcrumbRootType.SHARED

    if not breadcrumb:
        return BreadcrumbRootType.HOME  # Default fallback

    # Get the root folder ID (first element in breadcrumb)
    root_folder_id = breadcrumb[0][0]

    # Check if it's a special folder (home or inbox)
    stmt = select(SpecialFolder.folder_type).where(
        SpecialFolder.folder_id == root_folder_id
    )
    result = await db_session.execute(stmt)
    folder_type = result.scalar_one_or_none()

    if folder_type == FolderType.INBOX:
        return BreadcrumbRootType.INBOX

    return BreadcrumbRootType.HOME  # Default to HOME


async def get_descendants(
    db_session: AsyncSession, node_ids: list[UUID], include_selfs=True
) -> list[Tuple[UUID, str]]:
    """Returns descendants of all `node_ids` nodes

    When user selects documents and folders in UI he/she wants actually
    to delete selected nodes (documents and folders) we well as their
    descendants. `node_ids` will be documents and folders' IDs users
    selected in UI.
    """

    if not isinstance(node_ids, list):
        raise ValueError("node_ids argument must be a list")

    if len(node_ids) < 1:
        raise ValueError("len(node_ids) must be >= 1 ")

    nodes_anchor = (
        select(orm.Node.id, orm.Node.title)
        .where(orm.Node.id.in_(node_ids))
        .cte(recursive=True, name="tree")
    )
    tree = nodes_anchor.union_all(
        select(orm.Node.id, orm.Node.title).where(
            nodes_anchor.c.id == orm.Node.parent_id
        )
    )

    stmt = select(tree.c.id, tree.c.title).select_from(tree)

    if not include_selfs:
        stmt = stmt.where(tree.c.id.not_in(node_ids))

    result = await db_session.execute(stmt)

    return [(row.id, row.title) for row in result]


async def has_node_perm(
    db_session: AsyncSession,
    node_id: UUID,
    codename: str,
    user_id: UUID,
) -> bool:
    """
    Has user `codename` permission for `node_id`?
    """
    ancestor_ids = [item[0] for item in await get_ancestors(db_session, node_id)]

    # Get groups user belongs to
    user_groups_stmt = select(UserGroup.group_id).where(UserGroup.user_id == user_id)
    user_group_ids_result = await db_session.execute(user_groups_stmt)
    user_group_ids = [row[0] for row in user_group_ids_result]

    # Check 1: Direct ownership - user owns OR user's group owns
    node_access = (
        select(orm.Node.id)
        .select_from(orm.Node)
        .join(
            Ownership,
            and_(
                Ownership.resource_type == 'node',
                Ownership.resource_id == orm.Node.id
            )
        )
        .where(
            orm.Node.id == node_id,
            or_(
                and_(
                    Ownership.owner_type == OwnerType.USER.value,
                    Ownership.owner_id == user_id
                ),
                and_(
                    Ownership.owner_type == OwnerType.GROUP.value,
                    Ownership.owner_id.in_(user_group_ids)
                )
            )
        )
    )

    # Check 2: Shared access (unchanged)
    sn = aliased(sn_orm.SharedNode)
    n = aliased(orm.Node)
    r = aliased(roles_orm.Role)
    rp = aliased(roles_orm.roles_permissions_association)
    p = aliased(roles_orm.Permission)

    node_shared_access = (
        select(sn.id)
        .select_from(sn)
        .join(n, n.id == sn.node_id)
        .join(r, r.id == sn.role_id)
        .join(rp, rp.c.role_id == r.id)
        .join(p, p.id == rp.c.permission_id)
        .where(
            (p.codename == codename)
            & (sn.node_id.in_(ancestor_ids))
            & ((sn.user_id == user_id) | (sn.group_id.in_(user_group_ids)))
        )
    )

    stmt = exists(node_access.union_all(node_shared_access)).select()
    has_access = (await db_session.execute(stmt)).scalar_one()

    return has_access


async def get_node_owner(db_session: AsyncSession, node_id: UUID) -> OwnedBy:
    """
    Get the owner of a node using the ownerships table.

    Returns OwnedBy schema with owner information.
    """

    # Use the ownership API helper function
    owner = await ownership_api.get_owner_details(
        session=db_session,
        resource_type=ResourceType.NODE,
        resource_id=node_id
    )

    if owner is None:
        raise ValueError(f"No owner found for node {node_id}")

    return owner
