from datetime import datetime
from typing import List, Literal, Tuple
from uuid import UUID

from pydantic import BaseModel


class Folder(BaseModel):
    id: UUID
    title: str
    ctype: Literal["folder"]
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    user_id: UUID
    breadcrumb: List[Tuple[UUID, str]]

    class Config:
        from_attributes = True


class CreateFolder(BaseModel):
    title: str
    ctype: Literal["folder"]
    parent_id: UUID | None
