from datetime import datetime
from typing import List, Literal, Optional, Tuple
from uuid import UUID

from django.db.models.manager import BaseManager
from pydantic import (BaseModel, ConfigDict, FieldValidationInfo,
                      field_validator)

from papermerge.core.schemas.users import User as BaseUser
from papermerge.core.types import OCRStatusEnum


class Page(BaseModel):
    id: UUID
    number: int
    text: str = ''
    lang: str

    # Config
    model_config = ConfigDict(from_attributes=True)


class DocumentVersion(BaseModel):
    id: UUID
    number: int
    lang: str
    file_name: str | None = None
    size: int = 0
    page_count: int = 0
    short_description: str
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

    # Config
    model_config = ConfigDict(from_attributes=True)


class Folder(BaseModel):
    id: UUID
    title: str
    ctype: Literal["folder"]
    created_at: datetime
    updated_at: datetime
    breadcrumb: List[Tuple[UUID, str]]

    # Configs
    model_config = ConfigDict(from_attributes=True)


class Document(BaseModel):
    id: UUID
    title: str
    ctype: Literal["document"]
    created_at: datetime
    updated_at: datetime
    breadcrumb: list[Tuple[UUID, str]]
    versions: Optional[List[DocumentVersion]] = []
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown

    @field_validator("versions", mode='before')
    def get_all_from_manager(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
        return v

    # Config
    model_config = ConfigDict(from_attributes=True)


class User(BaseUser):
    password: str
    nodes: list[Document | Folder] = []

    @field_validator("nodes", mode='before')
    def get_all_from_manager(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            ret = []
            for item in v.all():
                if item.is_folder:
                    ret.append(
                        Folder.model_validate(item.folder)
                    )
                else:
                    ret.append(
                        Document.model_validate(item.document)
                    )

            return ret
        return v
