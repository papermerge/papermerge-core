
from datetime import datetime
from typing import List, Literal, Optional, Tuple
from uuid import UUID

from django.conf import settings
from django.db.models.manager import BaseManager
from pydantic import (BaseModel, ConfigDict, Field, ValidationInfo,
                      field_validator)
from typing_extensions import Annotated

from papermerge.core import constants as const
from papermerge.core import pathlib as plib
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
        if settings.FILE_SERVER == 'local':
            return f"/api/pages/{info.data['id']}/svg"

        s3_url = _s3_page_svg_url(
            info.data['id']  # UUID of the page here
        )
        return s3_url

    @field_validator("jpg_url", mode='before')
    @classmethod
    def jpg_url_value(cls, value, info: ValidationInfo) -> str:
        if settings.FILE_SERVER == 'local':
            return f"/api/pages/{info.data['id']}/jpg"

        s3_url = _s3_page_thumbnail_url(
            info.data['id'],  # UUID of the page here
            size=const.DEFAULT_PAGE_SIZE
        )

        return s3_url

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
    def download_url_validator(cls, _, info):
        if settings.FILE_SERVER == 'local':
            return f"/api/document-versions/{info.data['id']}/download"

        return _s3_docver_download_url(info.data['id'], info.data['file_name'])

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
        if settings.FILE_SERVER == 'local':
            return f"/api/thumbnails/{info.data['id']}"

        # if it is not local, then it is s3 + cloudfront
        return _s3_doc_thumbnail_url(info.data['id'])

    @field_validator('tags', mode='before')
    def tags_validator(cls, value):
        if not isinstance(value, list):
            return list(value.all())

        return value

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateDocument(BaseModel):
    # UUID may be present to allow custom IDs
    # See https://github.com/papermerge/papermerge-core/issues/325
    id: UUID | None = None
    title: str
    ctype: Literal["document"]
    parent_id: UUID | None
    lang: str | None = None
    file_name: str | None = None
    # Will OCR be triggered immediately?
    # True: means, yes, trigger OCR after upload
    # False: means, skip OCR
    ocr: bool = True

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "invoice.pdf",
                    "ctype": "document",
                    "parent_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
                }
            ]
        }
    }


class Thumbnail(BaseModel):
    url: str
    size: int


def _s3_doc_thumbnail_url(uid: UUID) -> str:
    from papermerge.core.cloudfront import sign_url

    resource_path = plib.thumbnail_path(uid)
    prefix = getattr(settings, 'PREFIX', None)
    if prefix:
        url = f"https://{settings.CF_DOMAIN}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.CF_DOMAIN}/{resource_path}"

    return sign_url(
        url,
        valid_for=600  # valid for 600 seconds
    )


def _s3_page_thumbnail_url(uid: UUID, size: int) -> str:
    from papermerge.core.cloudfront import sign_url

    resource_path = plib.thumbnail_path(uid, size=size)
    prefix = getattr(settings, 'PREFIX', None)
    if prefix:
        url = f"https://{settings.CF_DOMAIN}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.CF_DOMAIN}/{resource_path}"

    return sign_url(
        url,
        valid_for=600  # valid for 600 seconds
    )


def _s3_page_svg_url(uid: UUID) -> str:
    from papermerge.core.cloudfront import sign_url

    resource_path = plib.page_svg_path(uid)
    prefix = getattr(settings, 'PREFIX', None)
    if prefix:
        url = f"https://{settings.CF_DOMAIN}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.CF_DOMAIN}/{resource_path}"

    return sign_url(
        url,
        valid_for=600  # valid for 600 seconds
    )


def _s3_docver_download_url(uid: UUID, file_name: str) -> str:
    from papermerge.core.cloudfront import sign_url

    resource_path = plib.docver_path(uid, file_name)
    prefix = getattr(settings, 'PREFIX', None)
    if prefix:
        url = f"https://{settings.CF_DOMAIN}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.CF_DOMAIN}/{resource_path}"

    return sign_url(
        url,
        valid_for=600  # valid for 600 seconds
    )
