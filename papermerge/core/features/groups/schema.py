import uuid
from datetime import datetime
from typing import Optional, Dict, Any, Literal

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field

from papermerge.core.schemas.common import ByUser


class Group(BaseModel):
    id: uuid.UUID
    name: str
    delete_me: bool | None = Field(default=False)
    delete_special_folders: bool | None = Field(default=False)
    home_folder_id: uuid.UUID | None = Field(default=None)
    inbox_folder_id: uuid.UUID | None = Field(default=None)

    # Config
    model_config = ConfigDict(from_attributes=True)


class GroupDetails(BaseModel):
    id: uuid.UUID
    name: str
    home_folder_id: uuid.UUID | None = None
    inbox_folder_id: uuid.UUID | None = None

    created_at: datetime | None = None
    created_by: ByUser | None = None
    updated_at: datetime | None = None
    updated_by: ByUser | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class GroupEx(Group):
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


class CreateGroup(BaseModel):
    name: str
    # create special folders (inbox & home) as well
    with_special_folders: bool = False

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateGroup(BaseModel):
    name: str
    with_special_folders: bool | None = Field(default=False)


class GroupParams(BaseModel):
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

    filter_with_users: Optional[str] = Query(
        None,
        description="Comma-separated list of users that are part of the group"
    )

    filter_without_users: Optional[str] = Query(
        None,
        description="Comma-separated list of users that are NOT part of this group"
    )

    def to_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        filters = {}

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }

        if self.filter_with_users:
            filters["with_users"] = {
                "value": self.filter_with_users.split(","),
                "operator": "in"
            }

        if self.filter_without_users:
            filters["without_users"] = {
                "value": self.filter_without_users.split(","),
                "operator": "in"
            }


        return filters if filters else None
