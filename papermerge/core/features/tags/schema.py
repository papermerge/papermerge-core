from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, Literal

from fastapi import Query
from pydantic import BaseModel, ConfigDict

from papermerge.core.constants import DEFAULT_TAG_BG_COLOR, DEFAULT_TAG_FG_COLOR
from papermerge.core.schemas.common import ByUser, OwnedBy


class Tag(BaseModel):
    id: UUID
    name: str
    bg_color: str | None = DEFAULT_TAG_BG_COLOR
    fg_color: str | None = DEFAULT_TAG_FG_COLOR
    description: str | None = None
    pinned: bool = False
    group_id: UUID | None = None
    group_name: str | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class TagEx(BaseModel):
    id: UUID
    name: str
    owned_by: OwnedBy
    bg_color: str | None = DEFAULT_TAG_BG_COLOR
    fg_color: str | None = DEFAULT_TAG_FG_COLOR
    description: str | None = None
    created_at: datetime | None = None
    created_by: ByUser | None = None
    updated_at: datetime | None = None
    updated_by: ByUser | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class TagDetails(BaseModel):
    id: UUID
    name: str
    bg_color: str | None = DEFAULT_TAG_BG_COLOR
    fg_color: str | None = DEFAULT_TAG_FG_COLOR
    description: str | None = None

    created_at: datetime | None = None
    created_by: ByUser | None = None
    updated_at: datetime | None = None
    updated_by: ByUser | None = None
    owned_by: OwnedBy

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateTag(BaseModel):
    name: str
    bg_color: str = DEFAULT_TAG_BG_COLOR
    fg_color: str = DEFAULT_TAG_FG_COLOR
    description: str | None = None
    pinned: bool = False
    group_id: UUID | None = None
    user_id: UUID | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateTag(BaseModel):
    name: Optional[str] = None
    bg_color: Optional[str] = None
    fg_color: Optional[str] = None
    description: Optional[str] = None
    pinned: Optional[bool] = False
    group_id: UUID | None = None
    user_id: UUID | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class ColoredTag(BaseModel):
    id: UUID
    object_id: UUID
    tag: Tag


class TagParams(BaseModel):
    # Pagination parameters
    page_size: int = Query(
        15,
        ge=1,
        le=100,
        description="Number of items per page"
    )
    page_number: int = Query(
        1,
        ge=1,
        description="Page number (1-based)"
    )

    # Sorting parameters
    sort_by: Optional[str] = Query(
        None,
        pattern="^(id|name|created_at|updated_at|created_by|updated_by)$",
        description="Column to sort by: id, name, created_at, updated_at, created_by, updated_by"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    filter_free_text: Optional[str] = Query(
        None,
        description="Filter by free text"
    )

    def to_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        filters = {}

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }

        return filters if filters else None
