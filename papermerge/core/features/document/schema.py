from enum import Enum
from typing import TypeAlias, List
from uuid import UUID
from fastapi import Query

from papermerge.core.features.custom_fields.schema import CustomFieldType
from papermerge.core.types import CFNameType, CFValueType

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

from papermerge.core.features.nodes.schema import Node
from papermerge.core import constants as const
from papermerge.core import pathlib as plib
from papermerge.core.types import OCRStatusEnum
from papermerge.core import config

settings = config.get_settings()


class CFV(BaseModel):
    # custom field value
    # `documents.node_id`
    document_id: UUID
    # `core_documents.document_type_id`
    document_type_id: UUID
    # `custom_fields.id`
    custom_field_id: UUID
    # `custom_fields.name`
    name: CFNameType
    # `custom_fields.type`
    type: CustomFieldType
    # `custom_fields.extra_data`
    extra_data: str | dict | None
    # `custom_field_values.id`
    custom_field_value_id: UUID | None = None
    # `custom_field_values.value_text` or `custom_field_values.value_int` or ...
    value: CFValueType = None

    @field_validator("value", mode="before")
    @classmethod
    def convert_value(cld, value, info: ValidationInfo) -> CFValueType:
        if value and info.data["type"] == CustomFieldType.monetary:
            return float(value)

        if value and info.data["type"] == CustomFieldType.boolean:
            if value.lower() == "f":
                return False

            if value.lower() == "false":
                return False

        return value


CustomFieldTupleType: TypeAlias = tuple[CFNameType, CFValueType, CustomFieldType]


class DocumentCFV(BaseModel):
    id: UUID
    title: str
    # created_at: datetime
    # updated_at: datetime
    # parent_id: UUID | None
    # user_id: UUID
    document_type_id: UUID | None = None
    thumbnail_url: str | None = None
    custom_fields: list[CustomFieldTupleType]

    @field_validator("custom_fields", mode="before")
    @classmethod
    def convert_value(cld, value, info: ValidationInfo) -> CFValueType:
        if value:
            new_value: list[CustomFieldTupleType] = []
            for item in value:
                if item[2] == CustomFieldType.monetary and item[1]:
                    new_item: CustomFieldTupleType = (item[0], float(item[1]), item[2])
                    new_value.append(new_item)
                else:
                    new_item: CustomFieldTupleType = (item[0], item[1], item[2])
                    new_value.append(new_item)

            return new_value

        return value


class DocumentCustomFieldsAddValue(BaseModel):
    custom_field_id: UUID  # custom field ID here, NOT custom field *value* ID!
    value: str


class DocumentCustomFieldsAdd(BaseModel):
    document_type_id: UUID | None = None
    custom_fields: list[DocumentCustomFieldsAddValue]


class DocumentCustomFieldsUpdateValue(BaseModel):
    custom_field_value_id: UUID
    value: str


class DocumentCustomFieldsUpdate(BaseModel):
    custom_field_value_id: UUID | None = None
    key: CFNameType
    value: CFValueType


class Tag(BaseModel):
    name: str
    bg_color: str = "#c41fff"
    fg_color: str = "#FFFFF"

    # Config
    model_config = ConfigDict(from_attributes=True)


class MicroPage(BaseModel):
    id: UUID
    number: int


class Page(BaseModel):
    id: UUID
    number: int
    text: str | None = None
    lang: str
    document_version_id: UUID
    svg_url: Annotated[str | None, Field(validate_default=True)] = None
    jpg_url: Annotated[str | None, Field(validate_default=True)] = None

    @field_validator("svg_url", mode="before")
    @classmethod
    def svg_url_value(cls, value, info: ValidationInfo) -> str:
        if settings.papermerge__main__file_server == "local":
            return f"/api/pages/{info.data['id']}/svg"

        s3_url = _s3_page_svg_url(info.data["id"])  # UUID of the page here
        return s3_url

    @field_validator("jpg_url", mode="before")
    @classmethod
    def jpg_url_value(cls, value, info: ValidationInfo) -> str:
        if settings.papermerge__main__file_server == "local":
            return f"/api/pages/{info.data['id']}/jpg"

        s3_url = _s3_page_thumbnail_url(
            info.data["id"],  # UUID of the page here
            size=const.DEFAULT_PAGE_SIZE,
        )

        return s3_url

    # Config
    model_config = ConfigDict(from_attributes=True)


DownloadUrl = Annotated[str | None, Field(validate_default=True)]


class DocumentVersion(BaseModel):
    id: UUID
    number: int
    lang: str
    file_name: str | None = None
    size: int = 0
    page_count: int = 0
    short_description: str | None = None
    document_id: UUID
    download_url: DownloadUrl = None
    pages: list[Page] | None = []

    @field_validator("download_url", mode="before")
    def download_url_validator(cls, _, info):
        if settings.papermerge__main__file_server == config.FileServer.LOCAL.value:
            return f"/api/document-versions/{info.data['id']}/download"

        return _s3_docver_download_url(info.data["id"], info.data["file_name"])

    # Config
    model_config = ConfigDict(from_attributes=True)


def thumbnail_url(value, info):
    return f"/api/thumbnails/{info.data['id']}"


ThumbnailUrl = Annotated[str | None, Field(validate_default=True)]


class Document(BaseModel):
    id: UUID
    title: str
    ctype: Literal["document"]
    tags: list[Tag] = []
    # created_at: datetime
    # updated_at: datetime
    parent_id: UUID | None
    document_type_id: UUID | None = None
    breadcrumb: list[tuple[UUID, str]] = []
    versions: list[DocumentVersion] | None = []
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
    thumbnail_url: ThumbnailUrl = None
    user_id: UUID

    @field_validator("thumbnail_url", mode="before")
    def thumbnail_url_validator(cls, value, info):
        if settings.papermerge__main__file_server == config.FileServer.LOCAL.value:
            return f"/api/thumbnails/{info.data['id']}"

        # if it is not local, then it is s3 + cloudfront
        return _s3_doc_thumbnail_url(info.data["id"])

    # Config
    model_config = ConfigDict(from_attributes=True)


class NewDocument(BaseModel):
    # UUID may be present to allow custom IDs
    # See https://github.com/papermerge/papermerge-core/issues/325
    id: UUID | None = None
    title: str
    ctype: Literal["document"] = "document"
    parent_id: UUID | None
    lang: str | None = None
    file_name: str | None = None
    # Will OCR be triggered immediately?
    # True: means, yes, trigger OCR after upload
    # False: means, skip OCR
    ocr: bool = True
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
    size: int = 0
    page_count: int = 0

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "invoice.pdf",
                    "ctype": "document",
                    "parent_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
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
    prefix = settings.papermerge__main__prefix
    if prefix:
        url = f"https://{settings.CF_DOMAIN}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.CF_DOMAIN}/{resource_path}"

    return sign_url(
        url,
        valid_for=600,  # valid for 600 seconds
    )


def _s3_page_thumbnail_url(uid: UUID, size: int) -> str:
    from papermerge.core.cloudfront import sign_url

    resource_path = plib.thumbnail_path(uid, size=size)
    prefix = settings.papermerge__main__prefix
    if prefix:
        url = f"https://{settings.papermerge__main__cf_domain}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.papermerge__main__cf_domain}/{resource_path}"

    return sign_url(
        url,
        valid_for=600,  # valid for 600 seconds
    )


def _s3_page_svg_url(uid: UUID) -> str:
    from papermerge.core.cloudfront import sign_url

    resource_path = plib.page_svg_path(uid)
    prefix = settings.papermerge__main__prefix
    if prefix:
        url = f"https://{settings.papermerge__main__cf_domain}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.papermerge__main__cf_domain}/{resource_path}"

    return sign_url(
        url,
        valid_for=600,  # valid for 600 seconds
    )


def _s3_docver_download_url(uid: UUID, file_name: str) -> str:
    from papermerge.core.cloudfront import sign_url

    resource_path = plib.docver_path(uid, file_name)
    prefix = settings.papermerge__main__cf_domain
    if prefix:
        url = f"https://{settings.papermerge__main__cf_domain}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.papermerge__main__cf_domain}/{resource_path}"

    return sign_url(
        url,
        valid_for=600,  # valid for 600 seconds
    )


class MovePage(BaseModel):
    id: UUID
    number: int


class DocLastVersionInfo(BaseModel):
    page_count: int
    version_number: int
    lang: str
    file_name: str


class PageAndRotOp(BaseModel):
    page: MovePage
    angle: int = 0  # degrees
    # Rotate page `angle` degrees relative to the current angle.
    # `angle` can have positive or negative value.
    # `angle` must be a multiple of 90.
    # When `angle` > 0 -> the rotation is "clockwise".
    # When `angle` < 0 -> the rotation is "counterclockwise".


class MoveStrategy(Enum):
    """Pages Move Strategy

    MIX - means that source pages will blend in (mix in, append to) with target
    pages in other words the newly created target version will feature
    both source and target pages.
    REPLACE - means that source pages will overwrite target, in other
    words newly created target version will feature
    only source pages.
    """

    MIX = "mix"  # append
    REPLACE = "replace"  # overwrite


class MovePagesIn(BaseModel):
    source_page_ids: List[UUID]
    target_page_id: UUID
    move_strategy: MoveStrategy


class ExtractStrategy(Enum):
    ONE_PAGE_PER_DOC = "one-page-per-doc"
    ALL_PAGES_IN_ONE_DOC = "all-pages-in-one-doc"


class ExtractPagesIn(BaseModel):
    source_page_ids: List[UUID]
    target_folder_id: UUID
    strategy: ExtractStrategy
    title_format: str


class ExtractPagesOut(BaseModel):
    source: Document | None
    target: list[Node]


class MovePagesOut(BaseModel):
    source: Document | None
    target: Document


class DocumentTypeArg(BaseModel):
    document_type_id: UUID | None = None


OrderBy = Annotated[
    str | None,
    Query(
        description="""
    Name of custom field e.g. 'Total EUR' (without quotes). Note that
    custom field name is case sensitive and may include spaces
"""
    ),
]

PageSize = Annotated[int, Query(ge=1, lt=100, description="Number of items per page")]
PageNumber = Annotated[
    int,
    Query(ge=1, description="Page number. It is first, second etc. page?"),
]


class DocumentCFVWithIndex(BaseModel):
    dcfv: DocumentCFV
    index: int


class DocumentCFVRow(BaseModel):
    title: str
    doc_id: UUID
    document_type_id: UUID
    cf_name: CFNameType
    cf_type: CustomFieldType
    cf_value: CFValueType
