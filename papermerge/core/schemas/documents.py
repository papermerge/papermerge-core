from enum import Enum
from django.db.models.manager import BaseManager
from typing import Tuple
from pydantic import BaseModel, validator
from datetime import datetime
from typing import Literal
from uuid import UUID


class OCRStatusEnum(str, Enum):
    unknown = 'unknown'
    received = 'received'
    started = 'started'
    succeeded = 'succeeded'
    failed = 'failed'


class Page(BaseModel):
    id: UUID
    number: int
    text: str = ''
    lang: str
    document_version_id: UUID
    svg_url: str | None
    jpg_url: str | None

    @validator("svg_url")
    def svg_url_value(cls, value, values, config, field):
        return f"/api/pages/{values['id']}/svg"

    @validator("jpg_url")
    def jpg_url_value(cls, value, values, config, field):
        return f"/api/pages/{values['id']}/jpg"

    class Config:
        orm_mode = True


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
    pages: list[Page] = []

    @validator("pages", pre=True)
    def get_all_from_manager(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
        return v

    class Config:
        orm_mode = True


class Document(BaseModel):
    id: UUID
    title: str
    ctype: Literal["document"]
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    user_id: UUID
    breadcrumb: list[Tuple[UUID, str]]
    versions: list[DocumentVersion] = []
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown

    @validator("versions", pre=True)
    def get_all_from_manager(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
        return v

    class Config:
        orm_mode = True


class CreateDocument(BaseModel):
    title: str
    ctype: Literal["document"]
    parent_id: UUID | None
    lang: str | None = None
    file_name: str | None = None
