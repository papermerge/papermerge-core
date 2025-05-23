from enum import Enum
from typing import TypeAlias, List
from uuid import UUID
from fastapi import Query

from papermerge.core.features.custom_fields.schema import CustomFieldType
from papermerge.core.types import (
    CFNameType,
    CFValueType,
    ImagePreviewStatus,
    ImagePreviewSize,
)

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

from papermerge.core.features.nodes.schema import Node
from papermerge.core import constants as const
from papermerge.core import pathlib as plib
from papermerge.core.types import OCRStatusEnum
from papermerge.core import config
from papermerge.core.features.document import s3

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
    preview_image_sm_url: Annotated[str | None, Field(validate_default=True)] = None
    preview_image_md_url: Annotated[str | None, Field(validate_default=True)] = None
    preview_image_xl_url: Annotated[str | None, Field(validate_default=True)] = None
    preview_image_lg_url: Annotated[str | None, Field(validate_default=True)] = None
    preview_status_sm: Annotated[
        ImagePreviewStatus | None, Field(validate_default=True)
    ] = None
    preview_status_md: Annotated[
        ImagePreviewStatus | None, Field(validate_default=True)
    ] = None
    preview_status_lg: Annotated[
        ImagePreviewStatus | None, Field(validate_default=True)
    ] = None
    preview_status_xl: Annotated[
        ImagePreviewStatus | None, Field(validate_default=True)
    ] = None

    @field_validator("preview_image_sm_url", mode="before")
    @classmethod
    def preview_image_sm_url_value(cls, value, info: ValidationInfo):
        file_server = settings.papermerge__main__file_server
        if file_server == config.FileServer.LOCAL:
            return f"/api/pages/{info.data['id']}/jpg"

        # if it is not local, then it is s3 + CDN/cloudfront
        if (
            "preview_status_sm" in info.data
            and info.data["preview_status_sm"] == ImagePreviewStatus.ready
        ):
            if file_server == config.FileServer.S3:
                # give client back signed URL only in case preview image
                # was successfully uploaded to S3 backend.
                # `preview_status` is set to ready/failed by s3 worker
                # after preview image upload to s3 succeeds/fails
                return s3.page_image_jpg_signed_url(
                    info.data["id"], size=ImagePreviewSize.sm
                )

        return None

    @field_validator("preview_image_md_url", mode="before")
    @classmethod
    def preview_image_md_url_value(cls, value, info: ValidationInfo):
        file_server = settings.papermerge__main__file_server
        if file_server == config.FileServer.LOCAL:
            return f"/api/pages/{info.data['id']}/jpg"

        if (
            "preview_status_md" in info.data
            and info.data["preview_status_md"] == ImagePreviewStatus.ready
        ):
            if file_server == config.FileServer.S3:
                return s3.page_image_jpg_signed_url(
                    info.data["id"], size=ImagePreviewSize.md
                )

        return None

    @field_validator("preview_image_lg_url", mode="before")
    @classmethod
    def preview_image_lg_url_value(cls, value, info: ValidationInfo):
        file_server = settings.papermerge__main__file_server
        if file_server == config.FileServer.LOCAL:
            return f"/api/pages/{info.data['id']}/jpg"

        if (
            "preview_status_lg" in info.data
            and info.data["preview_status_lg"] == ImagePreviewStatus.ready
        ):
            if file_server == config.FileServer.S3:
                return s3.page_image_jpg_signed_url(
                    info.data["id"], size=ImagePreviewSize.lg
                )

        return None

    @field_validator("preview_image_xl_url", mode="before")
    @classmethod
    def preview_image_xl_url_value(cls, value, info: ValidationInfo):
        file_server = settings.papermerge__main__file_server
        if file_server == config.FileServer.LOCAL:
            return f"/api/pages/{info.data['id']}/jpg"

        if (
            "preview_status_xl" in info.data
            and info.data["preview_status_xl"] == ImagePreviewStatus.ready
        ):
            if file_server == config.FileServer.S3:
                return s3.page_image_jpg_signed_url(
                    info.data["id"], size=ImagePreviewSize.xl
                )

        return None

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
        file_server = settings.papermerge__main__file_server
        if file_server == config.FileServer.LOCAL:
            return f"/api/document-versions/{info.data['id']}/download"

        return None

    # Config
    model_config = ConfigDict(from_attributes=True)


def thumbnail_url(value, info):
    return f"/api/thumbnails/{info.data['id']}"


ThumbnailUrl = Annotated[str | None, Field(validate_default=True)]


class DocumentNode(BaseModel):
    """Document without versions

    The point of this class is to be used when listing folders/documents in
    which case info about document versions (and their pages etc) is not
    required (generating document version info in context of CDN is very
    slow as for each page of each doc ver signed URL must be computed)
    """

    id: UUID
    title: str
    ctype: Literal["document"]
    tags: list[Tag] = []
    # created_at: datetime
    # updated_at: datetime
    parent_id: UUID | None
    document_type_id: UUID | None = None
    breadcrumb: list[tuple[UUID, str]] = []
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
    thumbnail_url: ThumbnailUrl = None
    preview_status: str | None = None
    user_id: UUID | None = None
    group_id: UUID | None = None
    owner_name: str | None = None
    perms: list[str] = []
    is_shared: bool = False

    @field_validator("thumbnail_url", mode="before")
    def thumbnail_url_validator(cls, value, info):
        file_server = settings.papermerge__main__file_server
        if file_server == config.FileServer.LOCAL:
            return f"/api/thumbnails/{info.data['id']}"

        # if it is not local, then it is s3 + CDN/cloudfront
        if (
            "preview_status" in info.data
            and info.data["preview_status"] == ImagePreviewStatus.ready
        ):
            if file_server == config.FileServer.S3:
                # give client back signed URL only in case preview image
                # was successfully uploaded to S3 backend.
                # `preview_status` is set to ready/failed by s3 worker
                # after preview image upload to s3 succeeds/fails
                return s3.doc_thumbnail_signed_url(info.data["id"])

        return None

    # Config
    model_config = ConfigDict(from_attributes=True)


class Document(DocumentNode):
    versions: list[DocumentVersion] | None = []


class DocumentPreviewImageStatus(BaseModel):
    doc_id: UUID
    status: ImagePreviewStatus | None
    preview_image_url: str | None = None


class StatusForSize(BaseModel):
    status: ImagePreviewStatus | None
    url: str | None = None
    size: ImagePreviewSize


class PagePreviewImageStatus(BaseModel):
    page_id: UUID
    status: list[StatusForSize]


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
