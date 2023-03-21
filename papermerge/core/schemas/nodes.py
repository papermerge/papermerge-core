from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class NodeType(str, Enum):
    document = "document"
    folder = "folder"


class Node(BaseModel):
    id: UUID
    title: str
    ctype: NodeType
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    user_id: UUID

    class Config:
        orm_mode = True


class CreateNode(BaseModel):
    title: str
    ctype: NodeType.folder
    parent_id: UUID | None

    class Config:
        orm_mode = True
