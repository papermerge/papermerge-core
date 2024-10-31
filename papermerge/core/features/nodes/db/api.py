import uuid

from sqlalchemy import select

from papermerge.core.db.engine import Session
from papermerge.core.features.nodes import schema as nodes_schema
from papermerge.core.features.nodes.db import orm as nodes_orm

from .orm import Folder


def get_folder_by_id(db_session: Session, id: uuid.UUID) -> nodes_schema.Folder:
    stmt = select(Folder).where(Folder.id == id)
    db_folder = db_session.scalars(stmt).one_or_none()
    return nodes_schema.Folder.model_validate(db_folder)


def update_node(
    db_session: Session,
    node_id: uuid.UUID,
    user_id: uuid.UUID,
    attrs: nodes_schema.UpdateNode,
) -> nodes_schema.Node:
    stmt = select(nodes_orm.Node).where(
        nodes_orm.Node.id == node_id, nodes_orm.Node.user_id == user_id
    )
    node = db_session.scalars(stmt).one_or_none()
    if attrs.title is not None:
        node.title = attrs.title

    if attrs.parent_id is not None:
        node.parent_id = attrs.parent_id

    db_session.commit()

    return nodes_schema.Node.model_validate(node)
