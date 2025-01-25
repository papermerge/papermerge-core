from enum import Enum
from fastapi import Query
from pydantic import BaseModel


class OrderBy(str, Enum):
    name_asc = "name"
    name_desc = "-name"
    type_asc = "type"
    type_desc = "-type"


class PaginatedQueryParams(BaseModel):
    page_size: int = Query(5, ge=1, description="Number of items per page")
    page_number: int = Query(
        1, ge=1, description="Page number. It is first, second etc. page?"
    )
    order_by: OrderBy | None = None
    filter: str | None = None
