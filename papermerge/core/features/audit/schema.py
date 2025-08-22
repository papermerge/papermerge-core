import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from .types import AuditOperation


class AuditLog(BaseModel):
    id: uuid.UUID
    table_name: str
    record_id: uuid.UUID
    operation: AuditOperation
    timestamp: datetime
    user_id: uuid.UUID
    username: str

    # Config
    model_config = ConfigDict(from_attributes=True)
