from fastapi import Query
from pydantic import BaseModel
from papermerge.core.features.nodes.schema import OrderBy


class CommonQueryParams(BaseModel):
    page_size: int = Query(5, ge=1, description="Number of items per page")
    page_number: int = Query(
        1, ge=1, description="Page number. It is first, second etc. page?"
    )
    order_by: OrderBy | None = None
    filter: str | None = None
