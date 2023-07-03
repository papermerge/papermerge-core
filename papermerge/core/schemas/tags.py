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
        schema_extra = {
            "example": [
                {
                    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    "name": "important",
                    "description": "tag for important documents",
                    "bg_color": "#ffaaff",
                    "fg_color": '#ff0000',
                    'pinned': True
                }
            ]
        }


class CreateTag(BaseModel):
    name: str
    bg_color: str = '#c41fff'
    fg_color: str = '#FFFFF'
    description: str | None = None
    pinned: bool = False

    class Config:
        orm_mode = True
        schema_extra = {
            "example": [
                {
                    "name": "important",
                    "description": "tag for important documents",
                    "bg_color": "#ffaaff",
                    "fg_color": '#ff0000',
                    'pinned': True
                }
            ]
        }


class UpdateTag(BaseModel):
    name: str | None
    bg_color: str | None
    fg_color: str | None
    description: str | None
    pinned: bool | None

    class Config:
        orm_mode = True
