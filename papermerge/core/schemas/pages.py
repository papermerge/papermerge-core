from uuid import UUID

from pydantic import BaseModel


class Page(BaseModel):
    id: UUID
    number: int


class PageAndRotOp(BaseModel):
    page: Page
    ccw: int = 0
