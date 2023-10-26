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


class MoveStrategy(Enum):
    """Pages Move Strategy

    MIX - means that source pages will blend in (mix in, append to) with target
    pages in other words the newly created target version will feature
    both source and target pages.
    REPLACE - means that source pages will overwrite target, in other
    words newly created target version will feature
    only source pages.
    """
    MIX = 'mix'  # append
    REPLACE = 'replace'  # overwrite


class MovePagesIn(BaseModel):
    source_page_ids: List[UUID]
    target_page_id: UUID
    move_strategy: MoveStrategy
