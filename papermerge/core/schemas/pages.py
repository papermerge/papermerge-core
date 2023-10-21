from enum import Enum
from typing import List
from uuid import UUID

from pydantic import BaseModel


class Page(BaseModel):
    id: UUID
    number: int


class PageAndRotOp(BaseModel):
    page: Page
    angle: int = 0  # degrees
    # Rotate page `angle` degrees relative to the current angle.
    # `angle` can have positive or negative value.
    # `angle` must be a multiple of 90.
    # When `angle` > 0 -> the rotation is "clockwise".
    # When `angle` < 0 -> the rotation is "counterclockwise".


class InsertAt(Enum):
    BEGINNING = 'beginning'
    END = 'end'


class MoveStrategy(Enum):
    APPEND = 'append'
    REPLACE = 'replace'


class MovePages(BaseModel):
    source_pages_ids: List[UUID]
    target_page_id: UUID
    insert_at: InsertAt
    move_strategy: MoveStrategy
