from collections.abc import Iterable
from typing import List, Tuple, Iterator
from uuid import UUID

from sqlalchemy import text, select
from papermerge.core.db.engine import Session
from papermerge.core.features.nodes.db import orm


def get_ancestors(
    db_session: Session, node_id: UUID, include_self=True
) -> List[Tuple[UUID, str]]:
    """Returns all ancestors of the node"""
    if include_self:
        stmt = text(
            """
            WITH RECURSIVE tree AS (
                SELECT nodes.id, nodes.title, nodes.parent_id, 0 as level
                FROM nodes
                WHERE id = :node_id
                UNION ALL
                SELECT nodes.id, nodes.title, nodes.parent_id, level + 1
                FROM nodes, tree
                WHERE nodes.id = tree.parent_id
            )
            SELECT id, title
            FROM tree
            ORDER BY level DESC
        """
        )
    else:
        stmt = text(
            """
            WITH RECURSIVE tree AS (
                SELECT nodes.id, nodes.title, nodes.parent_id, 0 as level
                FROM nodes
                WHERE id = :node_id
                UNION ALL
                SELECT nodes.id, nodes.title, nodes.parent_id, level + 1
                FROM nodes, tree
                WHERE nodes.id = tree.parent_id
            )
            SELECT id, title
            FROM tree
            WHERE NOT id = :node_id
            ORDER BY level DESC
        """
        )

    # Ugly Hack - BEGIN
    # In case of mysql and sqlite table ID data type is stored
    # as char(32) without dashes i.e. '54eec77e345448b78af7b0dddd8ff425'.
    # Plus here sql statement is without ORM, so we need to take
    # care to convert node_id to spring without dashes
    engine = db_session.get_bind()
    if "mysql" in engine.name:
        node_id = node_id.hex

    if "sqlite" in engine.name:
        node_id = node_id.hex
    # Ugly Hack - END

    result = db_session.execute(stmt, {"node_id": node_id})

    items = list([(id, title) for id, title in result])

    return items


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
