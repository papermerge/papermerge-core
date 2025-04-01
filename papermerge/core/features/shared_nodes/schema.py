import uuid

from pydantic import BaseModel, ConfigDict


class SharedNode(BaseModel):
    id: uuid.UUID
    node_id: uuid.UUID
    user_id: uuid.UUID | None = None
    group_id: uuid.UUID | None = None
    owner_id: uuid.UUID
    role_id: uuid.UUID
