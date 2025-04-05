import uuid

from pydantic import BaseModel, ConfigDict


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
