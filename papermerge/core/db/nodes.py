import logging
from typing import List, TypeVar, Union
from uuid import UUID

from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session, selectin_polymorphic

from papermerge.core import schemas
from papermerge.core.types import PaginatedResponse

from .models import Document, Folder, Node

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
    order_by: List[str]
) -> PaginatedResponse[Union[schemas.Document, schemas.Folder]]:
    loader_opt = selectin_polymorphic(Node, [Folder, Document])

    stmt = (select(Node).filter_by(
        user_id=user_id,
        parent_id=parent_id
    ).offset(
        (page_number - 1) * page_size
    ).order_by(
     *str2colexpr(order_by)
    ).limit(
        page_size
    ).options(loader_opt))

    count_stmt = select(func.count()).select_from(Node)

    items = []

    with Session(engine) as session:
        total_nodes = session.scalar(count_stmt)
        num_pages = int(total_nodes / page_size)
        nodes = session.scalars(stmt).all()

        for node in nodes:
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
