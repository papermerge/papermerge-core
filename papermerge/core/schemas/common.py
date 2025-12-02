from collections.abc import Sequence
from typing import Generic, TypeVar
import uuid

from pydantic import BaseModel, ConfigDict

from papermerge.core.types import OwnerType, BreadcrumbRootType

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    page_size: int
    page_number: int
    num_pages: int
    total_items: int | None = None
    items: Sequence[T]

    model_config = ConfigDict(from_attributes=True)


class Category(BaseModel):
    id: uuid.UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class Tag(BaseModel):
    id: uuid.UUID
    name: str
    fg_color: str
    bg_color: str

    model_config = ConfigDict(from_attributes=True)


class ByUser(BaseModel):
    id: uuid.UUID | None = None
    username: str | None = None


class OwnedBy(BaseModel):
    id: uuid.UUID  # owner ID user_id, group_id etc
    name: str  # user.name, group.name etc
    type: OwnerType  # user, group etc

    model_config = ConfigDict(from_attributes=True)


class Breadcrumb(BaseModel):
    """
    Breadcrumb with path and root type information.

    The root type tells the frontend how to render the breadcrumb root:
    - home: render with home icon
    - inbox: render with inbox icon
    - shared: render with shared/user icon
    """
    path: list[tuple[uuid.UUID, str]]
    root: BreadcrumbRootType

    model_config = ConfigDict(from_attributes=True)
