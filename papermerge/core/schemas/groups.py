from pydantic import BaseModel, ConfigDict


class Group(BaseModel):
    id: int
    name: str

    # Config
    model_config = ConfigDict(from_attributes=True)


class GroupDetails(BaseModel):
    id: int
    name: str
    scopes: list[str]

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateGroup(BaseModel):
    name: str
    scopes: list[str]

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateGroup(BaseModel):
    name: str
    scopes: list[str]
