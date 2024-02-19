from datetime import datetime
from typing import Literal
from uuid import UUID

from django.db.models.manager import BaseManager
from pydantic import BaseModel, ConfigDict, ValidationInfo, field_validator

from papermerge.core.constants import (DEFAULT_TAG_BG_COLOR,
                                       DEFAULT_TAG_FG_COLOR)
from papermerge.core.types import OCRStatusEnum
from papermerge.core.version import __version__ as VERSION


class Tag(BaseModel):
    name: str
    bg_color: str = DEFAULT_TAG_BG_COLOR
    fg_color: str = DEFAULT_TAG_FG_COLOR
    description: str | None = None
    pinned: bool = False

    # Config
    model_config = ConfigDict(from_attributes=True)


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
    pages: list[Page] = []

    @field_validator("pages", mode='before')
    @classmethod
    def get_all_from_manager(cls, value, info: ValidationInfo) -> object:
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
    tags: list[Tag] = []

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

    @field_validator("tags", mode='before')
    def get_all_from_manager2(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
        return v


class Document(BaseModel):
    title: str
    ctype: Literal["document"]
    created_at: datetime
    updated_at: datetime
    breadcrumb: list[str]  # list of ancestor titles
    versions: list[DocumentVersion] = []
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
    tags: list[Tag] = []

    @field_validator("versions", mode='before')
    def get_all_from_manager(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
        return v

    @field_validator("tags", mode='before')
    def get_all_from_manager2(cls, v: object) -> object:
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
    tags: list[Tag] = []

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

    @field_validator("tags", mode='before')
    def get_all_from_manager2(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
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
