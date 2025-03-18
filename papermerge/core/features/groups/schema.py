import uuid

from pydantic import BaseModel, ConfigDict, Field


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

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateGroup(BaseModel):
    name: str
    # create special folders (inbox & home) as well
    with_special_folders: bool = False

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateGroup(BaseModel):
    name: str
    with_special_folders: bool | None = Field(default=False)
