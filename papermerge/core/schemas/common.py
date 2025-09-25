from collections.abc import Sequence
from typing import Generic, TypeVar, Literal
import uuid

from pydantic import BaseModel, ConfigDict

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
    id: uuid.UUID
    name: str  # Will be username for users, name for groups
    type: Literal["user", "group"]  # To distinguish the owner type

    model_config = ConfigDict(from_attributes=True)
