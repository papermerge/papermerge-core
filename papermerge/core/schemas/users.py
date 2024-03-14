from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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


class CreateUser(BaseModel):
    username: str
    email: str
    password: str

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateUser(BaseModel):
    username: str
    email: str
    password: str | None = None
