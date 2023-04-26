from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class User(BaseModel):
    id: UUID
    username: str
    email: str
    created_at: datetime
    updated_at: datetime
    home_folder_id: UUID | None
    inbox_folder_id: UUID | None

    class Config:
        orm_mode = True
