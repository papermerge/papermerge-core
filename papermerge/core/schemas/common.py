from collections.abc import Sequence
from typing import Generic, TypeVar
import uuid

from pydantic import BaseModel, ConfigDict

from papermerge.core.types import OwnerType

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    page_size: int
    page_number: int
    num_pages: int
    total_items: int | None = None
    items: Sequence[T]

    model_config = ConfigDict(from_attributes=True)


class ByUser(BaseModel):
    id: uuid.UUID | None = None
    username: str | None = None


class OwnedBy(BaseModel):
    id: uuid.UUID  # owner ID user_id, group_id etc
    name: str  # user.name, group.name etc
    type: OwnerType

    model_config = ConfigDict(from_attributes=True)
