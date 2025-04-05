from typing import List, Tuple
from uuid import UUID

from sqlalchemy import select, exists, literal
from sqlalchemy.orm import aliased
from papermerge.core.db.engine import Session
from papermerge.core.features.nodes.db import orm
from papermerge.core.features.shared_nodes.db import orm as sn_orm
from papermerge.core.features.groups.db import orm as groups_orm
from papermerge.core.features.roles.db import orm as roles_orm


def get_ancestors(
    db_session: Session, node_id: UUID, include_self=True
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

    result = db_session.execute(stmt)

    return [(row.id, row.title) for row in result]


def get_descendants(
    db_session: Session, node_ids: list[UUID], include_selfs=True
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

    result = db_session.execute(stmt)

    return [(row.id, row.title) for row in result]


def has_node_perm(
    db_session: Session,
    node_id: UUID,
    codename: str,
    user_id: UUID,
) -> bool:
    """
    Has user `codename` permission for `node_id`?

    SELECT EXISTS(
        SELECT nodes.id
        FROM nodes
        WHERE id = <node_id> AND
        (
            user_id = <user_id>
            OR
            group_id IN (
                SELECT ug.group_id
                FROM users_groups ug
                WHERE ug.user_id =  <user_id>
            )
        )
        UNION ALL
        SELECT sn.id
        FROM shared_nodes sn
        JOIN nodes n ON n.id = sn.node_id
        JOIN roles r ON r.id = sn.role_id
        JOIN roles_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE (
            sn.user_id = <user_id>
            OR
            sn.group_id IN (
                SELECT ug.group_id
                FROM users_groups ug
                WHERE ug.user_id =  <user_id>
            )
        )
        AND p.codename = <perm>
        AND sn.node_id IN (<node_id> ancestors)
    )
    """

    ancestor_ids = [item[0] for item in get_ancestors(db_session, node_id)]

    ug = aliased(groups_orm.user_groups_association)
    # groups user belongs to
    user_group_ids = select(ug.c.group_id).where(ug.c.user_id == user_id)

    node_access = select(orm.Node.id).where(
        (orm.Node.id == node_id)
        & ((orm.Node.user_id == user_id) | (orm.Node.group_id.in_(user_group_ids)))
    )
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

    has_access = db_session.execute(stmt).scalar()

    return has_access
