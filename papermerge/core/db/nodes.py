from typing import TypeVar, Union
from uuid import UUID

from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.types import PaginatedResponse

from .models import Node

T = TypeVar('T')


def get_paginated_nodes(
    engine: Engine,
    parent_id: UUID,
    user_id: UUID,
    page_size: int,
    page_number: int,
    order_by: int
) -> PaginatedResponse[Union[schemas.Folder, schemas.Document]]:

    stmt = select(Node).filter_by(
        user_id=user_id,
        parent_id=parent_id
    ).offset(
        (page_number - 1) * page_size
    ).limit(page_size)

    count_stmt = select(func.count()).select_from(Node)

    items = []

    with Session(engine) as session:
        total_nodes = session.scalar(count_stmt)
        num_pages = total_nodes / page_size
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

    return PaginatedResponse[Union[schemas.Folder, schemas.Document]](
        page_size=page_size,
        page_number=page_number,
        num_pages=num_pages,
        items=items
    )
