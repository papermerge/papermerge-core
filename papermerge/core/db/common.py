from typing import List, Tuple
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session


def get_ancestors(
    db: Session,
    node_id: UUID,
    include_self=True
) -> List[Tuple[UUID, str]]:
    """Returns all ancestors of the node"""
    if include_self:
        stmt = text('''
            WITH RECURSIVE tree AS (
                SELECT nodes.id, nodes.title, nodes.parent_id, 0 as level
                FROM core_basetreenode AS nodes
                WHERE id = :node_id
                UNION ALL
                SELECT nodes.id, nodes.title, nodes.parent_id, level + 1
                FROM core_basetreenode AS nodes, tree
                WHERE nodes.id = tree.parent_id
            )
            SELECT id, title
            FROM tree
            ORDER BY level DESC
        ''')
    else:
        stmt = text('''
            WITH RECURSIVE tree AS (
                SELECT nodes.id, nodes.title, nodes.parent_id, 0 as level
                FROM core_basetreenode AS nodes
                WHERE id = :node_id
                UNION ALL
                SELECT nodes.id, nodes.title, nodes.parent_id, level + 1
                FROM core_basetreenode AS nodes, tree
                WHERE nodes.id = tree.parent_id
            )
            SELECT id, title
            FROM tree
            WHERE NOT id = :node_id
            ORDER BY level DESC
        ''')

    # Ugly Hack - BEGIN
    # In case of mysql and sqlite table ID data type is stored
    # as char(32) without dashes i.e. '54eec77e345448b78af7b0dddd8ff425'.
    # Plus here sql statement is without ORM, so we need to take
    # care to convert node_id to spring without dashes
    engine = db.get_bind()
    if 'mysql' in engine.name:
        node_id = node_id.hex

    if 'sqlite' in engine.name:
        node_id = node_id.hex
    # Ugly Hack - END

    result = db.execute(stmt, {"node_id": node_id})

    items = list([(id, title) for id, title in result])

    return items
