import uuid

from pydantic import BaseModel, ConfigDict


class Group(BaseModel):
    id: uuid.UUID
    name: str

    # Config
    model_config = ConfigDict(from_attributes=True)


class GroupDetails(BaseModel):
    id: uuid.UUID
    name: str

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateGroup(BaseModel):
    name: str

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateGroup(BaseModel):
    name: str
