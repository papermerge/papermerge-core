from datetime import datetime
from typing import List, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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
    # breadcrumb: List[Tuple[UUID, str]]

    # Configs
    model_config = ConfigDict(from_attributes=True)


class CreateFolder(BaseModel):
    title: str
    ctype: Literal["folder"]
    parent_id: UUID | None
