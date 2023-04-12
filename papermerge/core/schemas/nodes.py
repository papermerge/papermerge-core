from enum import Enum
from pydantic import BaseModel, validator, ValidationError
from typing import Optional
from datetime import datetime
from uuid import UUID


class NodeType(str, Enum):
    document = "document"
    folder = "folder"


class UpdateNode(BaseModel):
    title: Optional[str]
    parent_id: Optional[UUID]

    @validator('parent_id')
    def parent_id_is_not_none(cls, value):
        if value is None:
            raise ValidationError('Cannot set parent_id to None')
        return value

    class Config:
        orm_mode = True


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
