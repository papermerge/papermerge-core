from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, Literal

from fastapi import Query
from pydantic import BaseModel, ConfigDict

from papermerge.core.schemas.common import ByUser, OwnedBy
from papermerge.core.types import OwnerType
from papermerge.core.features.custom_fields.schema import CustomField, \
    CustomFieldShort


class DocumentTypeShort(BaseModel):
    id: UUID
    name: str
    path_template: str | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class DocumentType(DocumentTypeShort):
    custom_fields: list[CustomField]
    owned_by: OwnedBy


class DocumentTypeDetails(BaseModel):
    id: UUID
    name: str
    path_template: str | None = None
    custom_fields: list[CustomFieldShort]

    owned_by: OwnedBy
    created_at: datetime
    # Both `created_by` and `updated_by`  should be optional.
    # The problem is that both columns are updated via a postgres trigger
    # which gets user details via AuditContext and the audit
    # context is missing in many parts of the tests.
    created_by: ByUser | None = None
    updated_at: datetime
    updated_by: ByUser | None = None
    archived_at: datetime | None = None
    archived_by: ByUser | None = None
    deleted_at: datetime | None = None
    deleted_by: ByUser | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateDocumentType(BaseModel):
    name: str
    path_template: str | None = None
    custom_field_ids: list[UUID]
    owner_type: OwnerType
    owner_id: UUID

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateDocumentType(BaseModel):
    name: str | None = None
    path_template: str | None = None
    custom_field_ids: list[UUID] | None = None
    owner_type: OwnerType | None = None
    owner_id: UUID | None = None


class GroupedDocumentTypeItem(BaseModel):
    id: UUID
    name: str  # document type name


class GroupedDocumentType(BaseModel):
    name: str  # group name
    items: list[GroupedDocumentTypeItem]


class DocumentTypeEx(BaseModel):
    id: UUID
    name: str

    owned_by: OwnedBy
    created_at: datetime | None = None
    created_by: ByUser | None = None
    updated_at: datetime | None = None
    updated_by: ByUser | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class DocumentTypeParams(BaseModel):
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
        pattern="^(id|name|created_at|updated_at|created_by|updated_by|owned_by)$",
        description="Column to sort by: id, name, created_at, updated_at, created_by, updated_by, owned_by"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    filter_free_text: Optional[str] = Query(
        None,
        description="Filter by free text"
    )


    def to_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        filters = {}

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }


        return filters if filters else None
