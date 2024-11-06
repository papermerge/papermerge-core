import logging
import math
import uuid

from typing import Union, Tuple
from uuid import UUID

from sqlalchemy import func, select, delete
from sqlalchemy.orm import selectin_polymorphic, selectinload
from sqlalchemy.exc import IntegrityError

from papermerge.core.exceptions import EntityNotFound
from papermerge.core.db.common import get_ancestors, get_descendants
from papermerge.core.db.engine import Session
from papermerge.core.schemas import error as err_schema
from papermerge.core.features.nodes import schema as nodes_schema
from papermerge.core.features.document import schema as docs_schema
from papermerge.core.features.nodes.db import orm as nodes_orm
from papermerge.core.features.document.db import orm as doc_orm
from papermerge.core.features.tags.db import orm as tags_orm
from papermerge.core.types import PaginatedResponse

from .orm import Folder


logger = logging.getLogger(__name__)


def str2colexpr(keys: list[str]):
    result = []
    ORDER_BY_MAP = {
        "ctype": nodes_orm.Node.ctype,
        "-ctype": nodes_orm.Node.ctype.desc(),
        "title": nodes_orm.Node.title,
        "-title": nodes_orm.Node.title.desc(),
        "created_at": nodes_orm.Node.created_at,
        "-created_at": nodes_orm.Node.created_at.desc(),
        "updated_at": nodes_orm.Node.updated_at,
        "-updated_at": nodes_orm.Node.updated_at.desc(),
    }
    logger.debug(f"str2colexpr keys = {keys}")

    for key in keys:
        item = ORDER_BY_MAP.get(key, nodes_orm.Node.title)
        result.append(item)

    return result


def get_folder_by_id(db_session: Session, id: uuid.UUID) -> nodes_schema.Folder:
    stmt = select(Folder).where(Folder.id == id)
    db_folder = db_session.scalars(stmt).one_or_none()
    return nodes_schema.Folder.model_validate(db_folder)


def get_paginated_nodes(
    db_session: Session,
    parent_id: UUID,
    user_id: UUID,
    page_size: int,
    page_number: int,
    order_by: list[str],
    filter: str | None = None,
) -> PaginatedResponse[Union[docs_schema.Document, nodes_schema.Folder]]:
    loader_opt = selectin_polymorphic(nodes_orm.Node, [Folder, doc_orm.Document])

    if filter:
        query = (
            select(nodes_orm.Node)
            .options(selectinload(nodes_orm.Node.tags))
            .filter(
                func.lower(nodes_orm.Node.title).contains(
                    filter.strip().lower(), autoescape=True
                )
            )
            .filter_by(user_id=user_id, parent_id=parent_id)
        )
    else:
        query = (
            select(nodes_orm.Node)
            .options(selectinload(nodes_orm.Node.tags))
            .filter_by(user_id=user_id, parent_id=parent_id)
        )

    stmt = (
        query.offset((page_number - 1) * page_size)
        .order_by(*str2colexpr(order_by))
        .limit(page_size)
        .options(loader_opt)
    )

    count_stmt = (
        select(func.count())
        .select_from(nodes_orm.Node)
        .where(nodes_orm.Node.user_id == user_id, nodes_orm.Node.parent_id == parent_id)
    )

    items = []
    total_nodes = db_session.scalar(count_stmt)
    num_pages = math.ceil(total_nodes / page_size)
    nodes = db_session.scalars(stmt).all()
    for node in nodes:
        if node.ctype == "folder":
            items.append(nodes_schema.Folder.model_validate(node))
        else:
            items.append(docs_schema.Document.model_validate(node))

    return PaginatedResponse[Union[docs_schema.Document, nodes_schema.Folder]](
        page_size=page_size, page_number=page_number, num_pages=num_pages, items=items
    )


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


def create_folder(
    db_session: Session, attrs: nodes_schema.NewFolder, user_id: uuid.UUID
) -> Tuple[nodes_schema.Folder | None, err_schema.Error | None]:
    error = None
    folder_id = attrs.id or uuid.uuid4()

    folder = nodes_orm.Folder(
        id=folder_id,
        user_id=user_id,
        title=attrs.title,
        parent_id=attrs.parent_id,
        ctype="folder",
    )
    db_session.add(folder)
    try:
        db_session.commit()
    except IntegrityError as e:
        error = err_schema.Error(messages=[str(e)])
        folder = None
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        folder = None

    if folder:
        return nodes_schema.Folder.model_validate(folder), error

    return None, error


def assign_node_tags(
    db_session: Session, node_id: uuid.UUID, tags: list[str], user_id: uuid.UUID
) -> Tuple[docs_schema.Document | nodes_schema.Folder | None, err_schema.Error | None]:
    error = None

    stmt = select(nodes_orm.Node).where(
        nodes_orm.Node.id == node_id, nodes_orm.Node.user_id == user_id
    )
    node = db_session.scalars(stmt).one_or_none()

    if node is None:
        raise EntityNotFound(f"Node {node_id} not found")

    db_tags = [tags_orm.Tag(name=name, user_id=user_id) for name in tags]
    db_session.add_all(db_tags)

    try:
        db_session.commit()
        node.tags = db_tags
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    if node.ctype == "document":
        return docs_schema.Document.model_validate(node), error

    return nodes_schema.Folder.model_validate(node), error


def update_node_tags(
    db_session: Session, node_id: uuid.UUID, tags: list[str], user_id: uuid.UUID
) -> Tuple[docs_schema.Document | nodes_schema.Folder | None, err_schema.Error | None]:
    error = None

    stmt = select(nodes_orm.Node).where(
        nodes_orm.Node.id == node_id, nodes_orm.Node.user_id == user_id
    )
    node = db_session.scalars(stmt).one_or_none()

    if node is None:
        raise EntityNotFound(f"Node {node_id} not found")

    db_tags = [tags_orm.Tag(name=name, user_id=user_id) for name in tags]
    db_session.add_all(db_tags)

    try:
        db_session.commit()
        node.tags.extend(db_tags)
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    if node.ctype == "document":
        return docs_schema.Document.model_validate(node), error

    return nodes_schema.Folder.model_validate(node), error


def remove_node_tags(
    db_session: Session, node_id: uuid.UUID, tags: list[str], user_id: uuid.UUID
) -> Tuple[docs_schema.Document | nodes_schema.Folder | None, err_schema.Error | None]:
    error = None

    stmt = select(nodes_orm.Node).where(
        nodes_orm.Node.id == node_id, nodes_orm.Node.user_id == user_id
    )
    node = db_session.scalars(stmt).one_or_none()

    if node is None:
        raise EntityNotFound(f"Node {node_id} not found")

    db_tags = [tags_orm.Tag(name=name, user_id=user_id) for name in tags]
    db_session.add_all(db_tags)

    try:
        db_session.commit()
        new_db_tag_list = [tag for tag in node.tags if tag.name not in tags]
        node.tags = new_db_tag_list
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    if node.ctype == "document":
        return docs_schema.Document.model_validate(node), error

    return nodes_schema.Folder.model_validate(node), error


def get_folder(
    db_session: Session, folder_id: UUID, user_id: UUID
) -> Tuple[nodes_orm.Folder | None, err_schema.Error | None]:
    breadcrumb = get_ancestors(db_session, folder_id)
    stmt = select(nodes_orm.Folder).where(
        nodes_orm.Folder.id == folder_id, nodes_orm.Node.user_id == user_id
    )
    try:
        db_model = db_session.scalars(stmt).one()
        db_model.breadcrumb = breadcrumb
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    return db_model, None


def delete_nodes(
    db_session: Session, node_ids: list[UUID], user_id: UUID
) -> err_schema.Error | None:
    all_ids_to_be_deleted = [
        item[0] for item in get_descendants(db_session, node_ids=node_ids)
    ]

    stmt = delete(nodes_orm.Node).where(
        nodes_orm.Node.id.in_(all_ids_to_be_deleted), nodes_orm.Node.user_id == user_id
    )

    try:
        db_session.execute(stmt)
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return error

    return None
