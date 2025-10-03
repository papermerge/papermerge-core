import uuid
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any, Literal

from fastapi import Query
from pydantic import (
    BaseModel,
    ConfigDict,
    ValidationInfo,
    field_serializer,
    field_validator,
)

from papermerge.core.features.groups.schema import Group
from papermerge.core.features.roles.schema import Role
from papermerge.core.schemas.common import ByUser
from papermerge.core.features.preferences.schema import Preferences


class RemoteUser(BaseModel):
    """User model extracted from PAPERMERGE__AUTH__REMOTE_xyz headers"""

    username: str
    email: str = ""
    name: str = ""
    groups: list[str] | None = None
    roles: list[str] | None = None


class User(BaseModel):
    id: UUID | str
    username: str
    email: str
    created_at: datetime
    updated_at: datetime
    home_folder_id: UUID | None
    inbox_folder_id: UUID | None
    is_superuser: bool = False
    is_active: bool = False
    scopes: list[str] = []
    preferences: Preferences = Preferences()

    @field_validator("scopes")
    @classmethod
    def sorted_scopes(cls, v: list[str], info: ValidationInfo):
        return sorted(v)

    @field_serializer("scopes", when_used="json")
    def serialize_sorted_scopes(v: list[str]):
        return sorted(v)

    # Config
    model_config = ConfigDict(from_attributes=True)


class UserEx(User):
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


class UserDetails(BaseModel):
    id: UUID | str
    username: str
    email: str
    created_at: datetime
    updated_at: datetime
    home_folder_id: UUID | None
    inbox_folder_id: UUID | None
    is_superuser: bool
    is_active: bool
    scopes: list[str] = []
    groups: list[Group] = []
    roles: list[Role] = []
    created_at: datetime | None = None
    created_by: ByUser | None = None
    updated_at: datetime | None = None
    updated_by: ByUser | None = None

    # Config
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": uuid.uuid4(),
                    "username": "socrates",
                    "email": "socrates@truth.dom",
                    "home_folder_id": uuid.uuid4(),
                    "inbox_folder_id": uuid.uuid4(),
                    "scopes": ["node.create", "node.view", "node.delete", "node.move"],
                    "groups": [
                        {"id": 1, "name": "Admin"},
                        {"id": 2, "name": "Archiver"},
                    ],
                    "created_at": "2024-03-15T06:38:58.197883Z",
                    "updated_at": "2024-03-15T06:38:58.210525Z",
                }
            ]
        }
    }


class CreateUser(BaseModel):
    username: str
    email: str
    password: str
    is_superuser: bool
    is_active: bool
    role_ids: list[UUID]
    group_ids: list[UUID]

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateUser(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None
    is_superuser: bool | None = None
    is_active: bool | None = None
    scopes: list[str] | None = None
    group_ids: list[UUID] | None = None
    role_ids: list[UUID] | None = None


class ChangeUserPassword(BaseModel):
    userId: str
    password: str


class UserHome(BaseModel):
    group_name: str
    group_id: uuid.UUID
    home_id: uuid.UUID


class UserHomes(BaseModel):
    homes: list[UserHome]


class UserInbox(BaseModel):
    group_name: str
    group_id: uuid.UUID
    inbox_id: uuid.UUID


class UserInboxes(BaseModel):
    inboxes: list[UserInbox]


class UserParams(BaseModel):
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
        pattern="^(id|username|email|created_at|updated_at|created_by|updated_by)$",
        description="Column to sort by: id, username, email, created_at, updated_at, created_by, updated_by"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    filter_free_text: Optional[str] = Query(
        None,
        description="Filter by free text"
    )

    filter_with_roles: Optional[str] = Query(
        None,
        description="Comma-separated list of role names"
    )

    filter_without_roles: Optional[str] = Query(
        None,
        description="Comma-separated list of role names"
    )

    filter_with_groups: Optional[str] = Query(
        None,
        description="Comma-separated list of group names"
    )

    filter_without_groups: Optional[str] = Query(
        None,
        description="Comma-separated list of group names"
    )

    filter_with_scopes: Optional[str] = Query(
        None,
        description="Comma-separated list of scopes"
    )

    filter_without_scopes: Optional[str] = Query(
        None,
        description="Comma-separated list of scopes"
    )



    def to_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        filters = {}

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }

        if self.filter_with_roles:
            filters["with_roles"] = {
                "value": self.filter_with_roles.split(","),
                "operator": "in"
            }

        if self.filter_without_roles:
            filters["without_roles"] = {
                "value": self.filter_without_roles.split(","),
                "operator": "in"
            }

        if self.filter_with_groups:
            filters["with_groups"] = {
                "value": self.filter_with_groups.split(","),
                "operator": "in"
            }

        if self.filter_without_groups:
            filters["without_groups"] = {
                "value": self.filter_without_groups.split(","),
                "operator": "in"
            }

        if self.filter_with_scopes:
            filters["with_scopes"] = {
                "value": self.filter_with_scopes.split(","),
                "operator": "in"
            }

        if self.filter_without_scopes:
            filters["without_scopes"] = {
                "value": self.filter_without_scopes.split(","),
                "operator": "in"
            }



        return filters if filters else None
