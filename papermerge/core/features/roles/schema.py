import uuid

from pydantic import BaseModel, ConfigDict


class Permission(BaseModel):
    id: uuid.UUID
    name: str  # e.g. "Can create tags"
    codename: str  # e.g. "tag.create"

    # Config
    model_config = ConfigDict(from_attributes=True)


class Role(BaseModel):
    id: uuid.UUID
    name: str

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
