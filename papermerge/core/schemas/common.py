from collections.abc import Sequence
from typing import Generic, TypeVar


from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    page_size: int
    page_number: int
    num_pages: int
    items: Sequence[T]

    model_config = ConfigDict(from_attributes=True)
