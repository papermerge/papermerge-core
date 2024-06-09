from datetime import datetime
from typing import List, Literal, Tuple
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class Tag(BaseModel):
    name: str
    bg_color: str = '#c41fff'
    fg_color: str = '#FFFFF'

    # Config
    model_config = ConfigDict(from_attributes=True)


class Folder(BaseModel):
    id: UUID
    title: str
    ctype: Literal["folder"]
    tags: List[Tag] = []
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    user_id: UUID
    breadcrumb: List[Tuple[UUID, str]] = []

    @field_validator('tags', mode='before')
    def tags_validator(cls, value):
        if not isinstance(value, list):
            return list(value.all())

        return value

    # Configs
    model_config = ConfigDict(from_attributes=True)


class CreateFolder(BaseModel):
    # UUID may be present to allow custom IDs
    # See https://github.com/papermerge/papermerge-core/issues/325
    id: UUID | None = None
    title: str
    ctype: Literal["folder"]
    parent_id: UUID | None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "My Documents",
                    "ctype": "folder",
                    "parent_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
                },
            ]
        }
    }
