from pydantic import BaseModel, ConfigDict


class Permission(BaseModel):
    id: int
    name: str  # e.g. "Can create tags"
    codename: str  # e.g. "tag.create"
    # content_type_id field is not used
    # it is legacy field coming from Django's model centric permissions
    content_type_id: int = 1

    # Config
    model_config = ConfigDict(from_attributes=True)


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
