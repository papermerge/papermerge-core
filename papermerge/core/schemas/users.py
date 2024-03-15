import uuid
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Group(BaseModel):
    id: int
    name: str


class RemoteUser(BaseModel):
    """User model extracted from PAPERMERGE__AUTH__REMOTE_xyz headers"""
    username: str
    email: str = ''
    name: str = ''
    groups: list[str] = []


class User(BaseModel):
    id: UUID | str
    username: str
    email: str
    created_at: datetime
    updated_at: datetime
    home_folder_id: UUID | None
    inbox_folder_id: UUID | None
    scopes: list[str] = []

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
                    "scopes": [
                        "node.create",
                        "node.view",
                        "node.delete",
                        "node.move"
                    ],
                    "groups": [
                        {"id": 1, "name": "Admin"},
                        {"id": 2, "name": "Archiver"}
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
    scopes: list[str]  # list of scope names e.g. "user.create", "user.delete"
    group_ids: list[int]  # list of group IDs e.g. 65, 72

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateUser(BaseModel):
    username: str
    email: str
    password: str | None = None
