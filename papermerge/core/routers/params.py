from pydantic import BaseModel
from fastapi import Query


class CommonQueryParams(BaseModel):
    per_page: int = Query(
        5,
        ge=1,
        description="Number of items per page"
    )
    page_number: int = Query(
        1,
        ge=1,
        description="Page number. It is first, second etc page?"
    )
    order_by: str | None = None
