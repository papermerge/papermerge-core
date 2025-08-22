from uuid import UUID
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any

from sqlalchemy import func, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB, UUID as PG_UUID

from papermerge.core.db.base import Base


class AuditOperation(str, Enum):
    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    TRUNCATE = "TRUNCATE"

class AuditLog(Base):
    """
    Universal audit table for tracking all changes across audited tables.
    Works with both trigger-based and application-level auditing.
    """
    __tablename__ = 'audit_log'

    # Primary key
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    # What was changed
    table_name: Mapped[str] = mapped_column(String(63), nullable=False)  # PostgreSQL table name limit
    record_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)  # ID of the affected record
    operation: Mapped[AuditOperation] = mapped_column(String(10), nullable=False)

    # When
    timestamp: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Who (multiple sources of truth)
    user_id: Mapped[Optional[UUID]] = mapped_column(PG_UUID(as_uuid=True), nullable=True)  # App user
    username: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)  # App username
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Session tracking

    # Where/How
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    application: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'web', 'api', 'admin', etc.

    # What changed (detailed data)
    old_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    changed_fields: Mapped[Optional[list[str]]] = mapped_column(JSONB, nullable=True)  # List of changed field names
    # Used by association tables trigger
    audit_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Why (business context - application level only)
    reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Indexes for performance
    __table_args__ = (
        Index('idx_audit_log_table_record', 'table_name', 'record_id'),
        Index('idx_audit_log_timestamp', 'timestamp'),
        Index('idx_audit_log_user_id', 'user_id'),
        Index('idx_audit_log_operation', 'operation'),
    )


# Helper function to determine what fields changed
def get_changed_fields(old_record: dict, new_record: dict) -> tuple[list[str], dict, dict]:
    """
    Compare old and new records to identify changes.
    Returns: (changed_fields, old_values, new_values)
    """
    changed_fields = []
    old_values = {}
    new_values = {}

    all_fields = set(old_record.keys()) | set(new_record.keys())

    for field in all_fields:
        old_val = old_record.get(field)
        new_val = new_record.get(field)

        if old_val != new_val:
            changed_fields.append(field)
            old_values[field] = old_val
            new_values[field] = new_val

    return changed_fields, old_values, new_values
