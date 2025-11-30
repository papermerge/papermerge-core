import uuid
from typing import Optional, Literal, Dict, Any

from pydantic import ConfigDict
from pydantic import BaseModel
from fastapi import Query


class SharedNode(BaseModel):
    id: uuid.UUID
    node_id: uuid.UUID
    user_id: uuid.UUID | None = None
    group_id: uuid.UUID | None = None
    owner_id: uuid.UUID
    role_id: uuid.UUID

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateSharedNode(BaseModel):
    node_ids: list[uuid.UUID]
    role_ids: list[uuid.UUID]
    user_ids: list[uuid.UUID]
    group_ids: list[uuid.UUID]

    # Config
    model_config = ConfigDict(from_attributes=True)


class Role(BaseModel):
    name: str
    id: uuid.UUID
    # Config
    model_config = ConfigDict(frozen=True)


class User(BaseModel):
    username: str
    id: uuid.UUID
    roles: list[Role]


class Group(BaseModel):
    name: str
    id: uuid.UUID
    roles: list[Role]


class UserUpdate(BaseModel):
    id: uuid.UUID
    role_ids: list[uuid.UUID]


class GroupUpdate(BaseModel):
    id: uuid.UUID
    role_ids: list[uuid.UUID]


class SharedNodeAccessDetails(BaseModel):
    id: uuid.UUID  # Node ID
    users: list[User] = []
    groups: list[Group] = []


class SharedNodeAccessUpdate(BaseModel):
    id: uuid.UUID  # Node ID
    users: list[UserUpdate] = []
    groups: list[GroupUpdate] = []


class SharedNodeAccessUpdateResponse(BaseModel):
    id: uuid.UUID  # Node ID
    # is node still shared after access update ?
    is_shared: bool


class SharedNodeParams(BaseModel):
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
