from decimal import Decimal
from datetime import datetime, date
from enum import Enum
from typing import TypeAlias, List
from uuid import UUID
from typing import Optional, Literal, Annotated, Any

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, \
    field_validator

from papermerge.core.features.nodes.schema import NodeShort
from papermerge.core.schemas.common import ByUser, OwnedBy, Category, Tag
from papermerge.core.features.custom_fields.schema import (
    CustomFieldType,
    CustomFieldValueData
)
from papermerge.core.types import (
    CFNameType,
    CFValueType,
    ImagePreviewStatus,
    ImagePreviewSize,
)
from papermerge.core.types import OCRStatusEnum
from papermerge.core import config
from papermerge.core.features.document import s3

settings = config.get_settings()


class FlatDocument(BaseModel):
    id: UUID
    title: str
    category: Category | None = None
    tags: list[Tag]
    created_at: datetime | None = None
    created_by: ByUser | None = None
    updated_at: datetime | None = None
    updated_by: ByUser | None = None
    owned_by: OwnedBy | None = None


class SortDirection(str, Enum):
    """Sort direction"""
    ASC = "asc"
    DESC = "desc"


class SortBy(str, Enum):
    """Sorting options"""
    ID = "id"
    TITLE = "title"
    CATEGORY = "category"
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    CREATED_BY = "created_by"
    UPDATED_BY = "updated_by"
    OWNED_BY = "owned_by"


class DocumentParams(BaseModel):
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
    sort_by: Optional[SortBy] = Field(
        default=SortBy.UPDATED_AT,
        description="Sort results by field"
    )
    sort_direction: Optional[SortDirection] = Query(
        default=SortDirection.DESC,
        description="Sort direction: asc or desc"
    )

    filter_free_text: Optional[str] = Query(
        None,
        description="Filter by free text"
    )

    def to_filters(self):
        filters = {}

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }


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


class CustomFieldShort(BaseModel):
    """Custom field definition"""
    id: UUID
    name: str
    type_handler: str
    config: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class CustomFieldValueShort(BaseModel):
    """Custom field value for a document"""
    value: CustomFieldValueData

    value_text: str | None = None
    value_numeric: Decimal | None = None
    value_date: date | None = None
    value_datetime: datetime | None = None
    value_boolean: bool | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomFieldRow(BaseModel):
    custom_field: CustomFieldShort | None = None
    custom_field_value: CustomFieldValueShort | None = None


class DocumentCFV(BaseModel):
    id: UUID
    title: str

    created_at: datetime
    updated_at: datetime
    created_by: ByUser | None = None
    updated_by: ByUser | None = None

    document_type_id: UUID | None = None
    thumbnail_url: str | None = None
    custom_fields: list[CustomFieldRow]


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
    id: UUID
    bg_color: str = "#c41fff"
    fg_color: str = "#FFFFF"

    # Config
    model_config = ConfigDict(from_attributes=True)


class MicroPage(BaseModel):
    id: UUID
    number: int


class BasicPage(BaseModel):
    id: UUID
    number: int

    # Config
    model_config = ConfigDict(from_attributes=True)


class Page(BasicPage):
    text: str | None = None
    document_version_id: UUID
    lang: str

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
    pages: list[BasicPage] | None = Field(default_factory=list)

    @field_validator("download_url", mode="before")
    def download_url_validator(cls, _, info):
        file_server = settings.papermerge__main__file_server
        if file_server == config.FileServer.S3:
            return s3.doc_ver_signed_url(info.data['id'], info.data['file_name'])

        return f"/api/document-versions/{info.data['id']}/download"


    # Config
    model_config = ConfigDict(from_attributes=True)



class DocVerListItem(BaseModel):
    id: UUID
    number: int
    short_description: str | None = None


def thumbnail_url(value, info):
    return f"/api/thumbnails/{info.data['id']}"


ThumbnailUrl = Annotated[str | None, Field(validate_default=True)]


class DocumentBase(BaseModel):
    id: UUID
    title: str
    ctype: Literal["document"]
    tags: list[Tag] = Field(default_factory=list)
    parent_id: UUID | None
    preview_status: str | None = None
    thumbnail_url: ThumbnailUrl = None
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


class DocumentNode(DocumentBase):
    """Document without versions

    The point of this class is to be used when listing folders/documents in
    which case info about document versions (and their pages etc) is not
    required (generating document version info in context of CDN is very
    slow as for each page of each doc ver signed URL must be computed)
    """
    document_type_id: UUID | None = None
    breadcrumb: list[tuple[UUID, str]] = Field(default_factory=list)
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
    owner_name: str | None = None
    perms: list[str] = Field(default_factory=list)
    is_shared: bool = False

    # Config
    model_config = ConfigDict(from_attributes=True)


class Document(DocumentNode):
    versions: list[DocumentVersion] = Field(default_factory=list)


class DocumentShort(DocumentBase):
    pass


class DocumentWithoutVersions(DocumentNode):
    ...


class Pagination(BaseModel):
    page_size: int
    page_number: int
    num_pages: int  # total count of pages



class DocumentPreviewImageStatus(BaseModel):
    doc_id: UUID
    status: ImagePreviewStatus | None
    preview_image_url: str | None = None


class StatusForSize(BaseModel):
    status: ImagePreviewStatus | None
    url: str | None = None
    size: ImagePreviewSize


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

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "title": "invoice.pdf",
                    "ctype": "document",
                    "parent_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                }
            ]
        }
    )


class Thumbnail(BaseModel):
    url: str
    size: int


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
    target: list[NodeShort]


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
LimitedPageSize = Annotated[
    int, Query(ge=1, le=15, description="Number of items per page")
]


class DocumentCFVWithIndex(BaseModel):
    dcfv: DocumentCFV
    index: int


class DownloadURL(BaseModel):
    downloadURL: str


class DocumentsByTypeParams(BaseModel):
    """Query parameters for getting documents by type"""

    # Pagination parameters
    page_size: int = Query(
        5,
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
        description="Custom field name to sort by"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    def to_sort(self) -> Optional[dict]:
        """Convert to sort parameter for dbapi"""
        if self.sort_by and self.sort_direction:
            return {
                "field_name": self.sort_by,
                "direction": self.sort_direction
            }
        return None


class DocumentEx(DocumentBase):
    """Extended document with audit columns for paginated listing"""
    perms: list[str] = Field(default_factory=list)

    # Audit columns
    owned_by: OwnedBy
    created_at: datetime
    created_by: ByUser | None = None
    updated_at: datetime
    updated_by: ByUser | None = None
    ocr: bool = True
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
