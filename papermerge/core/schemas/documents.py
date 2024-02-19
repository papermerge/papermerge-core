
from datetime import datetime
from typing import List, Literal, Optional, Tuple
from uuid import UUID

from django.db.models.manager import BaseManager
from pydantic import (BaseModel, ConfigDict, Field, ValidationInfo,
                      field_validator)
from typing_extensions import Annotated

from papermerge.core.types import OCRStatusEnum


class Tag(BaseModel):
    name: str
    bg_color: str = '#c41fff'
    fg_color: str = '#FFFFF'

    # Config
    model_config = ConfigDict(from_attributes=True)


class Page(BaseModel):
    id: UUID
    number: int
    text: str = ''
    lang: str
    document_version_id: UUID
    svg_url: Annotated[Optional[str], Field(validate_default=True)] = None
    jpg_url: Annotated[Optional[str], Field(validate_default=True)] = None

    @field_validator("svg_url", mode='before')
    @classmethod
    def svg_url_value(cls, value, info: ValidationInfo) -> str:
        return f"/api/pages/{info.data['id']}/svg"

    @field_validator("jpg_url", mode='before')
    @classmethod
    def jpg_url_value(cls, value, info: ValidationInfo) -> str:
        return f"/api/pages/{info.data['id']}/jpg"

    # Config
    model_config = ConfigDict(from_attributes=True)


DownloadUrl = Annotated[
    str | None,
    Field(validate_default=True)
]


class DocumentVersion(BaseModel):
    id: UUID
    number: int
    lang: str
    file_name: str | None = None
    size: int = 0
    page_count: int = 0
    short_description: str
    document_id: UUID
    download_url: DownloadUrl = None
    pages: Optional[List[Page]] = []

    @field_validator("pages", mode='before')
    @classmethod
    def get_all_from_manager(cls, value, info: ValidationInfo) -> object:
        if isinstance(value, BaseManager):
            try:
                return list(value.all())
            except ValueError:
                return []
        return value

    @field_validator('download_url', mode='before')
    def thumbnail_url_validator(cls, _, info):
        return f"/api/document-versions/{info.data['id']}/download"

    # Config
    model_config = ConfigDict(from_attributes=True)


def thumbnail_url(value, info):
    return f"/api/thumbnails/{info.data['id']}"


ThumbnailUrl = Annotated[
    str | None,
    Field(validate_default=True)
]


class Document(BaseModel):
    id: UUID
    title: str
    ctype: Literal["document"]
    tags: List[Tag] = []
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    user_id: UUID
    breadcrumb: list[Tuple[UUID, str]] = []
    versions: Optional[List[DocumentVersion]] = []
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
    thumbnail_url: ThumbnailUrl = None

    @field_validator("versions", mode='before')
    def get_all_from_manager(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
        return v

    @field_validator('thumbnail_url', mode='before')
    def thumbnail_url_validator(cls, value, info):
        return f"/api/thumbnails/{info.data['id']}"

    @field_validator('tags', mode='before')
    def tags_validator(cls, value):
        if not isinstance(value, list):
            return list(value.all())

        return value

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateDocument(BaseModel):
    title: str
    ctype: Literal["document"]
    parent_id: UUID | None
    lang: str | None = None
    file_name: str | None = None


class Thumbnail(BaseModel):
    url: str
    size: int
