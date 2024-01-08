from typing import List, Tuple
from uuid import UUID

from sqlalchemy import Engine, select, text
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import Folder, Node


def get_folder(
    engine: Engine,
    folder_id: UUID,
    user_id: UUID
):
    with Session(engine) as session:
        breadcrumb = get_ancestors(session, folder_id)
        stmt = select(Folder).where(
            Folder.id == folder_id,
            Node.user_id == user_id
        )
        db_model = session.scalars(stmt).one()
        model = schemas.Folder.model_validate(db_model)
        model.breadcrumb = breadcrumb

    return model


def get_ancestors(
    db: Session,
    node_id: UUID,
    include_self=True
) -> List[Tuple[str, str]]:
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
            WHERE NOT id = node_id
            ORDER BY level DESC
        ''')

    result = db.execute(stmt, {"node_id": node_id})

    items = list([(id, title) for id, title in result])

    return items
