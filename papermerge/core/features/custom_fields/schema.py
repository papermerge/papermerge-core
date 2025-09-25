from enum import Enum
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any, Literal

from fastapi import Query
from pydantic import BaseModel, ConfigDict

from papermerge.core.schemas.common import ByUser


class CustomFieldType(str, Enum):
    text = "text"
    date = "date"
    boolean = "boolean"
    int = "int"
    float = "float"
    monetary = "monetary"
    # for salaries: e.g. "February, 2023"
    yearmonth = "yearmonth"


class CustomField(BaseModel):
    id: UUID
    name: str
    type: CustomFieldType
    # for sqlite database JSON field is stored as string
    # for pg database JSON field is stored as JSON data
    # and when fetched - is presented as python dictionary
    # Basically `extra_data` is either a stringified JSON i.e. json.dumps(...)
    # or an actually python dict (or None)
    extra_data: str | dict | None
    group_id: UUID | None = None
    group_name: str | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class CustomFieldEx(CustomField):
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


class CreateCustomField(BaseModel):
    name: str
    type: CustomFieldType
    extra_data: str | None = None
    group_id: UUID | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateCustomField(BaseModel):
    name: str | None = None
    type: CustomFieldType | None = None
    extra_data: str | None = None
    group_id: UUID | None = None
    user_id: UUID | None = None


class CustomFieldValue(CustomField):
    # notice that attribue `id` indicates the ID of
    # custom field value
    value: str | None = None
    # the ID of the custom field
    field_id: UUID

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
        pattern="^(id|name|created_at|updated_at|created_by|updated_by)$",
        description="Column to sort by: id, name, created_at, updated_at, created_by, updated_by"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    filter_free_text: Optional[str] = Query(
        None,
        description="Filter by free text"
    )

    filter_data_types: Optional[str] = Query(
        None,
        description="Comma-separated list of data types"
    )

    def to_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        filters = {}

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }

        if self.filter_data_types:
            filters["date_types"] = {
                "value": self.filter_data_types.split(","),
                "operator": "in"
            }


        return filters if filters else None
