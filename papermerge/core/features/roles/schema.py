import uuid
from datetime import datetime
from typing import Optional, Dict, Any, Literal

from fastapi import Query
from pydantic import BaseModel, ConfigDict


class ByUser(BaseModel):
    id: uuid.UUID
    username: str


class Permission(BaseModel):
    id: uuid.UUID
    name: str  # e.g. "Can create tags"
    codename: str  # e.g. "tag.create"

    # Config
    model_config = ConfigDict(from_attributes=True)


class Role(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime
    created_by: uuid.UUID
    created_by: ByUser
    updated_at: datetime
    updated_by: uuid.UUID
    updated_by: ByUser

    # Config
    model_config = ConfigDict(from_attributes=True)


class RoleDetails(BaseModel):
    id: uuid.UUID
    name: str
    scopes: list[str]

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateRole(BaseModel):
    name: str
    scopes: list[str]

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateRole(BaseModel):
    name: str
    scopes: list[str]


class RoleParams(BaseModel):
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
        regex="^(id|name|created_at|updated_at|created_by|updated_by)$",
        description="Column to sort by: id, name, created_at, updated_at, created_by, updated_by"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    filter_scope: Optional[str] = Query(
        None,
        description="Comma-separated list of scopes"
    )
    filter_created_by_username: Optional[str] = Query(
        None,
        description="Comma-separated list of usernames who created the role"
    )
    filter_updated_by_username: Optional[str] = Query(
        None,
        description="Comma-separated list of usernames who updated the role"
    )

    filter_free_text: Optional[str] = Query(
        None,
        description="Filter by free text"
    )

    def to_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        filters = {}

        if self.filter_scope:
            filters["scope"] = {
                "value": self.filter_operation.split(","),
                "operator": "in"
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

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }

        return filters if filters else None
