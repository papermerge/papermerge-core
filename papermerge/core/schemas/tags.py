from uuid import UUID

from pydantic import BaseModel


class Tag(BaseModel):
    id: UUID
    name: str
    bg_color: str = '#c41fff'
    fg_color: str = '#FFFFF'
    description: str | None = None
    pinned: bool = False

    class Config:
        orm_mode = True


class CreateTag(BaseModel):
    name: str
    bg_color: str = '#c41fff'
    fg_color: str = '#FFFFF'
    description: str | None = None
    pinned: bool = False

    class Config:
        orm_mode = True
