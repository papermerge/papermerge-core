import logging
import uuid
import math

from typing import Union, Tuple, Iterable
from uuid import UUID

from sqlalchemy import func, select, delete, update
from sqlalchemy.orm import selectin_polymorphic, selectinload
from sqlalchemy.exc import IntegrityError

from papermerge.core.exceptions import EntityNotFound
from papermerge.core.db.common import get_ancestors, get_descendants
from papermerge.core.db.engine import Session
from papermerge.core import schema, orm
from papermerge.core.types import PaginatedResponse
from papermerge.core.features.nodes import events
from papermerge.core.features.nodes.schema import DeleteDocumentsData

from .orm import Folder


logger = logging.getLogger(__name__)


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
    logger.debug(f"str2colexpr keys = {keys}")

    for key in keys:
        item = ORDER_BY_MAP.get(key, orm.Node.title)
        result.append(item)

    return result


def get_nodes(
    db_session: Session, user_id: UUID | None = None, node_ids: list[UUID] | None = None
) -> list[schema.Document | schema.Folder]:
    items = []
    if node_ids is None:
        node_ids = []

    if len(node_ids) > 0:
        stmt = (
            select(orm.Node)
            .options(selectinload(orm.Node.tags))
            .filter(orm.Node.id.in_(node_ids))
        )
    else:
        stmt = select(orm.Node).options(selectinload(orm.Node.tags))

    if user_id is not None:
        stmt = stmt.filter(orm.Node.user_id == user_id)

    nodes = db_session.scalars(stmt).all()

    for node in nodes:
        breadcrumb = get_ancestors(db_session, node.id, include_self=False)
        node.breadcrumb = breadcrumb
        if node.ctype == "folder":
            items.append(schema.Folder.model_validate(node))
        else:
            items.append(schema.Document.model_validate(node))

    return items


def get_folder_by_id(db_session: Session, id: uuid.UUID) -> schema.Folder:
    stmt = select(Folder).where(Folder.id == id)
    db_folder = db_session.scalars(stmt).one_or_none()
    return schema.Folder.model_validate(db_folder)


def get_paginated_nodes(
    db_session: Session,
    parent_id: UUID,
    user_id: UUID,
    page_size: int,
    page_number: int,
    order_by: list[str],
    filter: str | None = None,
) -> PaginatedResponse[Union[schema.Document, schema.Folder]]:
    loader_opt = selectin_polymorphic(orm.Node, [Folder, orm.Document])

    if filter:
        query = (
            select(orm.Node)
            .options(selectinload(orm.Node.tags))
            .filter(
                func.lower(orm.Node.title).contains(
                    filter.strip().lower(), autoescape=True
                )
            )
            .filter_by(user_id=user_id, parent_id=parent_id)
        )
    else:
        query = (
            select(orm.Node)
            .options(selectinload(orm.Node.tags))
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
        .select_from(orm.Node)
        .where(orm.Node.user_id == user_id, orm.Node.parent_id == parent_id)
    )

    total_nodes = db_session.scalar(count_stmt)
    nodes = db_session.scalars(stmt).all()

    items = []
    num_pages = math.ceil(total_nodes / page_size)

    for node in nodes:
        if node.ctype == "folder":
            items.append(schema.Folder.model_validate(node))
        else:
            items.append(schema.Document.model_validate(node))

    return PaginatedResponse[Union[schema.Document, schema.Folder]](
        page_size=page_size,
        page_number=page_number,
        num_pages=num_pages,
        items=items,
    )


def update_node(
    db_session: Session,
    node_id: uuid.UUID,
    user_id: uuid.UUID,
    attrs: schema.UpdateNode,
) -> schema.Node:
    stmt = select(orm.Node).where(orm.Node.id == node_id, orm.Node.user_id == user_id)
    node = db_session.scalars(stmt).one_or_none()
    if attrs.title is not None:
        node.title = attrs.title

    if attrs.parent_id is not None:
        node.parent_id = attrs.parent_id

    db_session.commit()

    return schema.Node.model_validate(node)


def create_folder(
    db_session: Session, attrs: schema.NewFolder, user_id: uuid.UUID
) -> Tuple[schema.Folder | None, schema.Error | None]:
    error = None
    folder_id = attrs.id or uuid.uuid4()

    folder = orm.Folder(
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
        error = schema.Error(messages=[str(e)])
        folder = None
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        folder = None

    if folder:
        return schema.Folder.model_validate(folder), error

    return None, error


def assign_node_tags(
    db_session: Session, node_id: uuid.UUID, tags: list[str], user_id: uuid.UUID
) -> Tuple[schema.Document | schema.Folder | None, schema.Error | None]:
    """Will assign tags with given name to the node

    Currently associated node tags not mentioned in the `tags` list will
    be disassociated (but tags won't be deleted).
    """
    error = None

    stmt = select(orm.Node).where(orm.Node.id == node_id, orm.Node.user_id == user_id)
    node = db_session.scalars(stmt).one_or_none()

    if node is None:
        raise EntityNotFound(f"Node {node_id} not found")

    existing_db_tags = db_session.execute(
        select(orm.Tag).where(orm.Tag.name.in_(tags))
    ).scalars()
    existing_db_tags_names = [t.name for t in existing_db_tags.all()]
    # create new tags if they don't exist
    new_db_tags = [
        orm.Tag(name=name, user_id=user_id)
        for name in tags
        if name not in existing_db_tags_names
    ]
    db_session.add_all(new_db_tags)
    db_session.commit()
    db_tags = db_session.execute(
        select(orm.Tag).where(orm.Tag.name.in_(tags))
    ).scalars()

    try:
        node.tags = db_tags.all()
        db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    if node.ctype == "document":
        return schema.Document.model_validate(node), error

    return schema.Folder.model_validate(node), error


def update_node_tags(
    db_session: Session, node_id: uuid.UUID, tags: list[str], user_id: uuid.UUID
) -> Tuple[schema.Document | schema.Folder | None, schema.Error | None]:
    error = None

    stmt = select(orm.Node).where(orm.Node.id == node_id, orm.Node.user_id == user_id)
    node = db_session.scalars(stmt).one_or_none()

    if node is None:
        raise EntityNotFound(f"Node {node_id} not found")

    db_tags = [orm.Tag(name=name, user_id=user_id) for name in tags]
    db_session.add_all(db_tags)

    try:
        db_session.commit()
        node.tags.extend(db_tags)
        db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    if node.ctype == "document":
        return schema.Document.model_validate(node), error

    return schema.Folder.model_validate(node), error


def get_node_tags(
    db_session: Session, node_id: uuid.UUID, user_id: uuid.UUID
) -> [Iterable[schema.Tag] | None, schema.Error | None]:
    """Retrieves all node's tags"""

    subq = select(orm.NodeTagsAssociation.tag_id).where(
        orm.NodeTagsAssociation.node_id == node_id
    )

    stmt = select(orm.Tag).where(orm.Tag.id.in_(subq), orm.Tag.user_id == user_id)

    try:
        tags = db_session.execute(stmt).scalars()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    return [schema.Tag.model_validate(t) for t in tags], None


def remove_node_tags(
    db_session: Session, node_id: uuid.UUID, tags: list[str], user_id: uuid.UUID
) -> Tuple[schema.Document | schema.Folder | None, schema.Error | None]:
    """Disassociates node tags"""
    error = None

    stmt = select(orm.Node).where(orm.Node.id == node_id, orm.Node.user_id == user_id)
    node = db_session.scalars(stmt).one_or_none()

    if node is None:
        raise EntityNotFound(f"Node {node_id} not found")

    tag_ids = select(orm.Tag.id).where(orm.Tag.name.in_(tags))
    delete_stmt = delete(orm.NodeTagsAssociation).where(
        orm.NodeTagsAssociation.tag_id.in_(tag_ids),
        orm.NodeTagsAssociation.node_id == node_id,
    )

    try:
        db_session.execute(delete_stmt)
        db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    if node.ctype == "document":
        return schema.Document.model_validate(node), error

    return schema.Folder.model_validate(node), error


def get_folder(
    db_session: Session, folder_id: UUID, user_id: UUID
) -> Tuple[orm.Folder | None, schema.Error | None]:
    breadcrumb = get_ancestors(db_session, folder_id)
    stmt = select(orm.Folder).where(
        orm.Folder.id == folder_id, orm.Node.user_id == user_id
    )
    try:
        db_model = db_session.scalars(stmt).one()
        db_model.breadcrumb = breadcrumb
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    return db_model, None


def delete_nodes(
    db_session: Session, node_ids: list[UUID], user_id: UUID
) -> schema.Error | None:
    all_ids_to_be_deleted = [
        item[0] for item in get_descendants(db_session, node_ids=node_ids)
    ]

    delete_details = prepare_documents_s3_data_deletion(
        db_session, all_ids_to_be_deleted
    )

    stmt = delete(orm.Node).where(
        orm.Node.id.in_(all_ids_to_be_deleted), orm.Node.user_id == user_id
    )

    # This second delete statement - is extra hack for Sqlite DB
    # For some reason, the (Polymorphic?) cascading does not work
    # in Sqlite, so here it is required to manually delete associated
    # custom fields
    sqlite_hack_stmt = delete(orm.CustomFieldValue).where(
        orm.CustomFieldValue.document_id.in_(all_ids_to_be_deleted)
    )

    try:
        db_session.execute(stmt)
        db_session.execute(sqlite_hack_stmt)
        db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return error

    events.delete_documents_s3_data(delete_details)
    return None


def move_nodes(
    db_session: Session, source_ids: list[UUID], target_id: UUID, user_id: UUID
) -> int:

    # Sqlite does not raise "Integrity Error" during update
    # when target does not exist. Thus, we issue here one more
    # extra sql statement just to check the existence of target_id
    stmt = select(orm.Node.id).where(orm.Node.id == target_id)
    target = db_session.execute(stmt).one_or_none()
    if target is None:
        raise EntityNotFound("Node target not found")

    stmt = (
        update(orm.Node).where(orm.Node.id.in_(source_ids)).values(parent_id=target_id)
    )
    result = db_session.execute(stmt)
    db_session.commit()

    return result.rowcount


def prepare_documents_s3_data_deletion(
    db_session: Session, node_ids: list[UUID]
) -> DeleteDocumentsData:
    """Extract information from the list of `node_ids` about to be deleted

    Note: all nodes from `node_ids` are about to be deleted

    Extracts a list of document IDs which are about to be deleted.

    Extracts a list of document version IDs belonging to the document
    IDs which are about to be deleted.

    Extracts a list of page IDs belonging to the document versions
    which are about to be deleted
    """
    stmt = (
        select(orm.Document.id, orm.DocumentVersion.id, orm.Page.id)
        .select_from(orm.Document)
        .join(orm.DocumentVersion)
        .join(orm.Page)
        .where(orm.Document.id.in_(node_ids))
    )
    doc_ids = set()
    page_ids = set()
    doc_ver_ids = set()

    for row in db_session.execute(stmt):
        doc_ids.add(row[0])
        doc_ver_ids.add(row[1])
        page_ids.add(row[2])

    return DeleteDocumentsData(
        document_ids=list(doc_ids),
        page_ids=list(page_ids),
        document_version_ids=list(doc_ver_ids),
    )
