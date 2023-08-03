from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from papermerge.core.constants import (DEFAULT_TAG_BG_COLOR,
                                       DEFAULT_TAG_FG_COLOR)


class Tag(BaseModel):
    id: UUID
    name: str
    bg_color: str = DEFAULT_TAG_BG_COLOR
    fg_color: str = DEFAULT_TAG_FG_COLOR
    description: str | None = None
    pinned: bool = False

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "name": "important",
                "description": "tag for important documents",
                "bg_color": "#ffaaff",
                "fg_color": '#ff0000',
                'pinned': True
            }
        }


class CreateTag(BaseModel):
    name: str
    bg_color: str = DEFAULT_TAG_BG_COLOR
    fg_color: str = DEFAULT_TAG_FG_COLOR
    description: str | None = None
    pinned: bool = False

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "name": "important",
                "description": "tag for important documents",
                "bg_color": "#ffaaff",
                "fg_color": '#ff0000',
                'pinned': True
            }
        }


class UpdateTag(BaseModel):
    name: Optional[str] = None
    bg_color: Optional[str] = None
    fg_color: Optional[str] = None
    description: Optional[str] = None
    pinned: Optional[bool] = False

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "name": "paid",
                "description": "tag for paid receipts",
                "bg_color": "#ffaaff",
                "fg_color": '#ff0000',
                'pinned': True
            }
        }
