from pydantic import BaseModel
from datetime import datetime
from typing import Literal
from uuid import UUID


class Node(BaseModel):
    id: UUID
    title: str
    ctype: Literal["document", "folder"]
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    user_id: UUID

    class Config:
        orm_mode = True
