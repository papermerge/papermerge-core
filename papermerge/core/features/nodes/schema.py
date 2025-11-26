from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from typing import List, Literal, Tuple
from uuid import UUID

from pydantic import BaseModel, ConfigDict, ValidationError, field_validator
from fastapi import Query

from papermerge.core.schemas.common import OwnedBy, ByUser
from papermerge.core.types import OCRStatusEnum
from papermerge.core.types import OwnerType


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


class NodeShort(BaseModel):
    id: UUID
    title: str
    ctype: NodeType
    tags: Optional[List[Tag]] = []
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    document: DocumentNode | None = None

    model_config = ConfigDict(from_attributes=True)


class Node(NodeShort):
    owned_by: OwnedBy

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
    owner_type: OwnerType
    owner_id: UUID

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

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "title": "My Documents",
                    "ctype": "folder",
                    "parent_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                },
            ]
        }
    )


class FolderShort(BaseModel):
    id: UUID
    title: str
    ctype: Literal["folder"]
    tags: List[Tag] = []
    parent_id: UUID | None
    is_shared: bool = False

    # Configs
    model_config = ConfigDict(from_attributes=True)


class Folder(NewFolder):
    id: UUID
    tags: List[Tag] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None
    owned_by: OwnedBy | None = None
    perms: list[str] = []
    is_shared: bool = False

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


class FolderEx(BaseModel):
    """Extended folder with audit columns for paginated listing"""
    id: UUID
    title: str
    ctype: Literal["folder"]
    tags: List[Tag] = []
    parent_id: UUID | None
    is_shared: bool = False

    # Audit columns
    owned_by: OwnedBy
    created_at: datetime
    created_by: ByUser | None = None
    updated_at: datetime
    updated_by: ByUser | None = None

    model_config = ConfigDict(from_attributes=True)


class NodeParams(BaseModel):
    # Pagination parameters
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
    sort_by: Optional[str] = Query(
        None,
        pattern="^(id|title|ctype|created_at|updated_at|created_by|updated_by|owned_by)$",
        description="Column to sort by: id, title, ctype, created_at, updated_at, created_by, updated_by, owned_by"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    # Filter parameters
    filter_free_text: Optional[str] = Query(
        None,
        description="Filter by free text (searches in title)"
    )

    filter_ctype: Optional[str] = Query(
        None,
        description="Filter by content type: folder, document"
    )

    filter_created_by_username: Optional[str] = Query(
        None,
        description="Comma-separated list of usernames who created the node"
    )

    filter_updated_by_username: Optional[str] = Query(
        None,
        description="Comma-separated list of usernames who updated the node"
    )

    filter_owner_name: Optional[str] = Query(
        None,
        description="Filter by owner name (user or group)"
    )

    def to_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        filters = {}

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }

        if self.filter_ctype:
            filters["ctype"] = {
                "value": self.filter_ctype,
                "operator": "eq"
            }

        if self.filter_created_by_username:
            filters["created_by_username"] = {
                "value": self.filter_created_by_username,
                "operator": "in"
            }

        if self.filter_updated_by_username:
            filters["updated_by_username"] = {
                "value": self.filter_updated_by_username,
                "operator": "in"
            }

        if self.filter_owner_name:
            filters["owner_name"] = {
                "value": self.filter_owner_name,
                "operator": "like"
            }

        return filters if filters else None
