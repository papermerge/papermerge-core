from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from django.db.models.manager import BaseManager
from pydantic import (BaseModel, ConfigDict, FieldValidationInfo,
                      field_validator)

from papermerge.core.types import OCRStatusEnum
from papermerge.core.version import __version__ as VERSION


class Page(BaseModel):
    id: UUID | str
    number: int
    text: str = ''
    lang: str

    # Config
    model_config = ConfigDict(from_attributes=True)


class DocumentVersion(BaseModel):
    id: UUID | str
    number: int
    lang: str
    file_name: str | None = None
    size: int = 0
    page_count: int = 0
    short_description: str
    text: str
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
    title: str
    ctype: Literal["folder"]
    created_at: datetime
    updated_at: datetime
    breadcrumb: list[str]   # list of ancestor titles

    # Configs
    model_config = ConfigDict(from_attributes=True)

    @field_validator("breadcrumb", mode='before')
    def get_breadcrumb(cls, v: object) -> object:
        """Discards UUID part from the breadcrumb tuple"""
        result = []
        for item in v:
            if isinstance(item, (list, tuple)):
                result.append(item[1])
            else:
                result.append(item)

        return result


class Document(BaseModel):
    title: str
    ctype: Literal["document"]
    created_at: datetime
    updated_at: datetime
    breadcrumb: list[str]  # list of ancestor titles
    versions: Optional[List[DocumentVersion]] = []
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown

    @field_validator("versions", mode='before')
    def get_all_from_manager(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
        return v

    @field_validator("breadcrumb", mode='before')
    def get_breadcrumb(cls, v: object) -> object:
        """Discards UUID part from the breadcrumb tuple"""
        result = []
        for item in v:
            if isinstance(item, (list, tuple)):
                result.append(item[1])
            else:
                result.append(item)

        return result

    # Config
    model_config = ConfigDict(from_attributes=True)


class User(BaseModel):
    username: str
    email: str
    created_at: datetime
    updated_at: datetime
    # Config
    model_config = ConfigDict(from_attributes=True)
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


class Backup(BaseModel):
    created: str = datetime.now().strftime("%d.%m.%Y-%H:%M:%S")
    version: str = VERSION
    users: list[User] = []

    def __str__(self):
        return f"Backup(version={self.version}, created={self.created},"\
                f" users=...)"

    def __repr__(self):
        return f"Backup(version={self.version}, created={self.created},"\
                f" users=...)"
