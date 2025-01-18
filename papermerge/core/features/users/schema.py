import uuid
from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    ValidationInfo,
    field_serializer,
    field_validator,
)


class Group(BaseModel):
    id: UUID
    name: str


class RemoteUser(BaseModel):
    """User model extracted from PAPERMERGE__AUTH__REMOTE_xyz headers"""

    username: str
    email: str = ""
    name: str = ""
    groups: list[str] | None = None


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

    @field_validator("scopes")
    @classmethod
    def sorted_scopes(cls, v: list[str], info: ValidationInfo):
        return sorted(v)

    @field_serializer("scopes", when_used="json")
    def serialize_sorted_scopes(v: list[str]):
        return sorted(v)

    # Config
    model_config = ConfigDict(from_attributes=True)


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

    # Config
    model_config = {
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
    scopes: list[str]  # list of scope names e.g. "user.create", "user.delete"
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


class ChangeUserPassword(BaseModel):
    userId: str
    password: str
