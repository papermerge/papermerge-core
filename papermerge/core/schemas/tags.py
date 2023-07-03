from uuid import UUID

from pydantic import BaseModel


class Tag(BaseModel):
    id: UUID
    name: str
    email: str
    bg_color: str
    fg_color: str
    description: str
    pinned: bool

    class Config:
        orm_mode = True
