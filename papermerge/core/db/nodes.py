from typing import TypeVar
from uuid import UUID

from sqlalchemy import Engine
from sqlalchemy.orm import Query

from .models import Node

T = TypeVar('T')


def get_paginated_nodes(
    engine: Engine,
    parent_id: UUID,
    user_id: UUID,
    page_size: int,
    page_number: int,
    order_by: int
):
    query = Query(Node).with_entities(
        Node.id,
        Node.title,
    ).filter_by(
        user_id=user_id,
        parent_id=parent_id
    ).offset(
        (page_number - 1) * page_size
    ).limit(page_size)

    return query
