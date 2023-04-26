from typing import List, Tuple
from pydantic import BaseModel
from datetime import datetime
from typing import Literal
from uuid import UUID


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
        orm_mode = True


class CreateFolder(BaseModel):
    title: str
    ctype: Literal["folder"]
    parent_id: UUID | None
