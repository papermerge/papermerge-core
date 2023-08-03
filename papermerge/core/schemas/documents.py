
from datetime import datetime
from typing import List, Literal, Optional, Tuple
from uuid import UUID

from django.db.models.manager import BaseManager
from pydantic import BaseModel, Field, FieldValidationInfo, field_validator
from typing_extensions import Annotated

from papermerge.core.types import OCRStatusEnum


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
    def svg_url_value(cls, value, info: FieldValidationInfo) -> str:
        return f"/api/pages/{info.data['id']}/svg"

    @field_validator("jpg_url", mode='before')
    @classmethod
    def jpg_url_value(cls, value, info: FieldValidationInfo) -> str:
        return f"/api/pages/{info.data['id']}/jpg"

    class Config:
        from_attributes = True


class DocumentVersion(BaseModel):
    id: UUID
    number: int
    lang: str
    file_name: str | None = None
    size: int = 0
    page_count: int = 0
    short_description: str
    document_id: UUID
    download_url: str | None = None
    pages: Optional[List[Page]] = []

    @field_validator("pages", mode='before')
    @classmethod
    def get_all_from_manager(cls, value, info: FieldValidationInfo) -> object:
        if isinstance(value, BaseManager):
            try:
                return list(value.all())
            except ValueError:
                return []
        return value

    @field_validator("download_url")
    @classmethod
    def download_url_value(cls, value, info: FieldValidationInfo):
        return f"/api/document-versions/{info.data['id']}/download"

    class Config:
        from_attributes = True


class Document(BaseModel):
    id: UUID
    title: str
    ctype: Literal["document"]
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    user_id: UUID
    breadcrumb: list[Tuple[UUID, str]]
    versions: Optional[List[DocumentVersion]] = []
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
    thumbnail_url: str | None = None

    @field_validator("versions", mode='before')
    def get_all_from_manager(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
        return v

    @field_validator('thumbnail_url')
    def thumbnail_url_validator(cls, value, values):
        return f"/api/thumbnails/{values['id']}"

    class Config:
        orm_mode = True
        from_attributes = True


class CreateDocument(BaseModel):
    title: str
    ctype: Literal["document"]
    parent_id: UUID | None
    lang: str | None = None
    file_name: str | None = None


class Thumbnail(BaseModel):
    url: str
    size: int
