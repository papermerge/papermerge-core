from decimal import Decimal
from enum import Enum
from datetime import datetime, date
from uuid import UUID
from typing import Optional, Dict, Any, Literal, Union

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field

from papermerge.core.schemas.common import ByUser, OwnedBy
from papermerge.core.types import OwnerType


class CustomFieldType(str, Enum):
    """Available custom field type handlers"""
    text = "text"
    integer = "integer"
    number = "number"
    boolean = "boolean"
    date = "date"
    datetime = "datetime"
    monetary = "monetary"
    select = "select"
    multiselect = "multiselect"
    url = "url"
    email = "email"
    yearmonth = "yearmonth"


class CustomFieldShort(BaseModel):
    """Custom field definition"""
    id: UUID
    name: str
    type_handler: str
    config: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class CustomField(CustomFieldShort):
    """Custom field definition"""
    owned_by: OwnedBy
    created_at: datetime
    updated_at: Optional[datetime] = None


class CustomFieldDetails(CustomField):
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


class CustomFieldEx(CustomField):
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


class CustomFieldValueData(BaseModel):
    """
    Core data structure for custom field values stored in JSONB

    This is what gets stored in the database value column
    """
    raw: Union[str, int, float, bool, list, None] = None
    sortable: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class CustomFieldValue(BaseModel):
    """Custom field value for a document"""
    id: UUID
    document_id: UUID
    field_id: UUID

    value: CustomFieldValueData

    value_text: str | None = None
    value_numeric: Decimal | None = None
    value_date: date | None = None
    value_datetime: datetime | None = None
    value_boolean: bool | None = None

    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CustomFieldWithValue(BaseModel):
    custom_field: CustomFieldShort
    value: CustomFieldValue | None


class CreateCustomField(BaseModel):
    """Schema for creating a custom field"""
    name: str = Field(min_length=1)
    type_handler: str
    config: dict[str, Any] = Field(default_factory=dict)
    owner_type: OwnerType | None = None
    owner_id: UUID | None = None
    created_by: UUID
    updated_by: UUID

    model_config = ConfigDict(from_attributes=True)


class UpdateCustomField(BaseModel):
    """Schema for updating a custom field"""
    name: Optional[str] = None
    type_handler: Optional[str] = None
    config: Optional[dict[str, Any]] = None
    owner_type: OwnerType | None = None
    owner_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class SetCustomFieldValue(BaseModel):
    """Schema for setting a custom field value"""
    field_id: UUID
    value: Any  # Type depends on field type


class CustomFieldFilter(BaseModel):
    """Filter specification for custom field queries"""
    field_id: UUID
    operator: str  # eq, ne, gt, gte, lt, lte, in, not_in, like, ilike, etc.
    value: Any

    model_config = ConfigDict(from_attributes=True)


class CustomFieldSort(BaseModel):
    """Sort specification for custom field queries"""
    field_id: UUID
    direction: str = Field(default="asc", pattern="^(asc|desc)$")

    model_config = ConfigDict(from_attributes=True)


class DocumentQueryParams(BaseModel):
    """Parameters for querying documents by custom fields"""
    document_type_id: UUID
    filters: list[CustomFieldFilter] = Field(default_factory=list)
    sort: Optional[CustomFieldSort] = None
    limit: Optional[int] = None
    offset: Optional[int] = None

class CustomFieldParams(BaseModel):
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
        pattern="^(id|name|type_handler|created_at|updated_at|created_by|updated_by|owned_by)$",
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

    filter_types: Optional[str] = Query(
        None,
        description="Comma-separated list of custom field types"
    )

    def to_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        filters = {}

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }

        if self.filter_types:
            filters["types"] = {
                "value": self.filter_types.split(","),
                "operator": "in"
            }


        return filters if filters else None
