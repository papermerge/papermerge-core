import logging
import math
import uuid
from typing import List, Sequence, TypeVar, Union
from uuid import UUID

from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session, selectin_polymorphic

from papermerge.core import schemas
from papermerge.core.schemas.documents import Tag as NodeTag
from papermerge.core.types import PaginatedResponse

from .common import get_ancestors
from .models import ColoredTag, Document, Folder, Node

T = TypeVar('T')


logger = logging.getLogger(__name__)


def str2colexpr(keys: List[str]):
    result = []
    ORDER_BY_MAP = {
        'ctype': Node.ctype,
        '-ctype': Node.ctype,
        'title': Node.title,
        '-title': Node.title,
        'created_at': Node.created_at,
        '-created_at': Node.created_at.desc(),
        'updated_at': Node.updated_at,
        '-updated_at': Node.updated_at.desc(),
    }
    logger.debug(f"str2colexpr keys = {keys}")
    for key in keys:
        if item := ORDER_BY_MAP.get(key, 'title'):
            result.append(item)

    return result


def get_paginated_nodes(
    engine: Engine,
    parent_id: UUID,
    user_id: UUID,
    page_size: int,
    page_number: int,
    order_by: List[str],
    filter: str | None = None
) -> PaginatedResponse[Union[schemas.Document, schemas.Folder]]:
    loader_opt = selectin_polymorphic(Node, [Folder, Document])

    if filter:
        query = select(Node).filter(
            func.lower(Node.title).contains(
                filter.strip().lower(), autoescape=True
            )
        ).filter_by(
            user_id=user_id,
            parent_id=parent_id
        )
    else:
        query = select(Node).filter_by(user_id=user_id, parent_id=parent_id)

    stmt = (query.offset(
        (page_number - 1) * page_size
    ).order_by(
     *str2colexpr(order_by)
    ).limit(
        page_size
    ).options(loader_opt))

    count_stmt = select(func.count()).select_from(Node).where(
        Node.user_id == user_id,
        Node.parent_id == parent_id
    )

    items = []

    with Session(engine) as session:
        total_nodes = session.scalar(count_stmt)
        num_pages = math.ceil(total_nodes / page_size)
        nodes = session.scalars(stmt).all()
        colored_tags_stmt = select(ColoredTag).where(
            ColoredTag.object_id.in_([n.id for n in nodes])
        )
        colored_tags = session.scalars(colored_tags_stmt).all()
        for node in nodes:
            tags = _get_tags_for(colored_tags, node.id)
            node.tags = tags
            if node.ctype == 'folder':
                items.append(
                    schemas.Folder.model_validate(node)
                )
            else:
                items.append(
                    schemas.Document.model_validate(node)
                )

    return PaginatedResponse[Union[schemas.Document, schemas.Folder]](
        page_size=page_size,
        page_number=page_number,
        num_pages=num_pages,
        items=items
    )


def get_nodes(
    db_session: Session,
    node_ids: list[uuid.UUID]
) -> list[schemas.Document | schemas.Folder]:
    items = []
    with db_session as session:
        if len(node_ids) > 0:
            stmt = select(Node).filter(
                Node.id.in_(node_ids)
            )
        else:
            stmt = select(Node)

        nodes = session.scalars(stmt).all()
        colored_tags_stmt = select(ColoredTag).where(
            ColoredTag.object_id.in_([n.id for n in nodes])
        )
        colored_tags = session.scalars(colored_tags_stmt).all()

        for node in nodes:
            tags = _get_tags_for(colored_tags, node.id)
            ancestors = get_ancestors(db_session, node.id, include_self=False)
            node.tags = tags
            node.breadcrumb = ancestors
            if node.ctype == 'folder':
                items.append(
                    schemas.Folder.model_validate(node)
                )
            else:
                items.append(
                    schemas.Document.model_validate(node)
                )

    return items


def _get_tags_for(
    colored_tags: Sequence[ColoredTag],
    node_id: UUID
) -> List[NodeTag]:
    node_tags = []

    for color_tag in colored_tags:
        if color_tag.object_id == node_id:
            node_tags.append(
                NodeTag.model_validate(color_tag.tag)
            )

    return node_tags
