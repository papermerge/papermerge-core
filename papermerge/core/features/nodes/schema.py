from enum import Enum
from typing import Optional


from datetime import datetime
from typing import List, Literal, Tuple
from uuid import UUID


from pydantic import BaseModel, ConfigDict, ValidationError, field_validator

from papermerge.core.types import OCRStatusEnum


class OrderBy(str, Enum):
    title_asc = "title"
    title_desc = "-title"
    ctype_asc = "ctype"
    ctype_desc = "-ctype"
    created_at_asc = "created_at"
    created_at_desc = "-created_at"
    updated_at_asc = "updated_at"
    updated_at_desc = "-updated_at"


class NodeType(str, Enum):
    document = "document"
    folder = "folder"


class Tag(BaseModel):
    name: str
    bg_color: str = "#c41fff"
    fg_color: str = "#FFFFF"

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateNode(BaseModel):
    title: Optional[str] = None
    parent_id: Optional[UUID] = None

    @field_validator("parent_id")
    def parent_id_is_not_none(cls, value):
        if value is None:
            raise ValidationError("Cannot set parent_id to None")
        return value

    # Config
    model_config = ConfigDict(from_attributes=True)


class DocumentNode(BaseModel):
    """Minimalist part of the document returned as part of nodes list"""

    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
    thumbnail_url: str


class Node(BaseModel):
    id: UUID
    title: str
    ctype: NodeType
    tags: Optional[List[Tag]] = []
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    user_id: UUID
    document: DocumentNode | None = None

    @field_validator("document", mode="before")
    def document_validator(cls, value, info):
        if info.data["ctype"] == NodeType.document:
            if isinstance(value, dict):
                kwargs = {
                    "ocr_status": value["ocr_status"],
                    "ocr": value["ocr"],
                    "thumbnail_url": f"/api/thumbnails/{info.data['id']}",
                }
            else:
                kwargs = {
                    "ocr_status": value.ocr_status,
                    "ocr": value.ocr,
                    "thumbnail_url": f"/api/thumbnails/{info.data['id']}",
                }
            return DocumentNode(**kwargs)

        return None

    @field_validator("tags", mode="before")
    def tags_validator(cls, value):
        if not isinstance(value, list):
            return list(value.all())

        return value

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateNode(BaseModel):
    title: str
    ctype: NodeType.folder
    parent_id: UUID | None

    # Configs
    model_config = ConfigDict(from_attributes=True)


class MoveNode(BaseModel):
    source_ids: List[UUID]
    target_id: UUID


class NewFolder(BaseModel):
    # UUID may be present to allow custom IDs
    # See https://github.com/papermerge/papermerge-core/issues/325
    id: UUID | None = None
    title: str
    ctype: Literal["folder"]
    parent_id: UUID | None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "My Documents",
                    "ctype": "folder",
                    "parent_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                },
            ]
        }
    }


class Folder(NewFolder):
    id: UUID
    tags: List[Tag] = []
    created_at: datetime
    updated_at: datetime
    user_id: UUID

    breadcrumb: List[Tuple[UUID, str]] = []

    @field_validator("tags", mode="before")
    def tags_validator(cls, value):
        if not isinstance(value, list):
            return list(value.all())

        return value

    # Configs
    model_config = ConfigDict(from_attributes=True)


class DeleteDocumentsData(BaseModel):
    document_ids: list[UUID]
    document_version_ids: list[UUID]
    page_ids: list[UUID]
