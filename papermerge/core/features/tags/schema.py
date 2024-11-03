from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from papermerge.core.constants import DEFAULT_TAG_BG_COLOR, DEFAULT_TAG_FG_COLOR


class Tag(BaseModel):
    id: UUID
    name: str
    bg_color: str | None = DEFAULT_TAG_BG_COLOR
    fg_color: str | None = DEFAULT_TAG_FG_COLOR
    description: str | None = None
    pinned: bool = False

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateTag(BaseModel):
    name: str
    bg_color: str = DEFAULT_TAG_BG_COLOR
    fg_color: str = DEFAULT_TAG_FG_COLOR
    description: str | None = None
    pinned: bool = False

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateTag(BaseModel):
    name: Optional[str] = None
    bg_color: Optional[str] = None
    fg_color: Optional[str] = None
    description: Optional[str] = None
    pinned: Optional[bool] = False

    # Config
    model_config = ConfigDict(from_attributes=True)


class ColoredTag(BaseModel):
    id: UUID
    object_id: UUID
    tag: Tag
