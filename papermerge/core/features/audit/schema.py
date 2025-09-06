import uuid
from datetime import datetime
from typing import Optional, Dict, Any, Literal

from fastapi import Query
from pydantic import BaseModel, ConfigDict, field_validator

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


class AuditLogDetails(AuditLog):
    old_values: dict | None = None
    new_values: dict | None = None
    changed_fields: list[str] | None = None
    audit_message: str | None = None
    reason: str | None = None
    user_agent: str | None = None
    application: str | None = None


class AuditLogParams(BaseModel):
    """
    Simple parameter class for audit log queries.
    Maps directly to frontend AuditLogQueryParams.
    """

    # Pagination parameters
    page_size: int = Query(
        15,
        ge=1,
        le=100,
        description="Number of items per page"
    )
    page_number: int = Query(
        1,
        ge=1,
        description="Page number (1-based)"
    )

    # Sorting parameters
    sort_by: Optional[str] = Query(
        None,
        pattern="^(timestamp|operation|table_name|username|record_id|user_id|id)$",
        description="Column to sort by: timestamp, operation, table_name, username, record_id, user_id, id"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    # Filter parameters - individual query parameters
    filter_operation: Optional[str] = Query(
        default=None,
        description="Comma-separated list of operations: INSERT,UPDATE,DELETE,TRUNCATE"
    )
    filter_table_name: Optional[str] = Query(
        None,
        description="Comma-separated list of table names (e.g. users, groups, nodes)"
    )
    filter_username: Optional[str] = Query(
        None,
        description="Filter by username (partial match, case-insensitive)"
    )
    filter_user_id: Optional[str] = Query(
        None,
        description="Filter by exact user ID match"
    )
    filter_record_id: Optional[str] = Query(
        None,
        description="Filter by record ID (partial match)"
    )

    # Date range filter parameters
    filter_timestamp_from: Optional[str] = Query(
        None,
        description="Filter from timestamp (ISO 8601 format: 2025-08-20T06:35:10Z)"
    )
    filter_timestamp_to: Optional[str] = Query(
        None,
        description="Filter to timestamp (ISO 8601 format: 2025-08-21T06:35:10Z)"
    )
    filter_free_text: Optional[str] = Query(
        None,
        description="Filter by free text"
    )

    @field_validator('filter_operation', mode='before')
    @classmethod
    def parse_operations(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            # Split by comma and validate each value
            operations = [op.strip().upper() for op in v.split(',')]
            valid_ops = {"INSERT", "UPDATE", "DELETE", "TRUNCATE"}
            for op in operations:
                if op not in valid_ops:
                    raise ValueError(f"Invalid operation: {op}")
            return v
        return v

    def to_advanced_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        filters = {}

        if self.filter_operation:
            filters["operation"] = {
                "value": self.filter_operation.split(","),
                "operator": "in"
            }

        if self.filter_table_name:
            filters["table_name"] = {
                "value": self.filter_table_name,
                "operator": "in"
            }

        if self.filter_username:
            filters["username"] = {
                "value": self.filter_username,
                "operator": "in"
            }

        if self.filter_free_text:
            filters["free_text"] = {
                "value": self.filter_free_text,
                "operator": "free_text"
            }

        # Handle timestamp range filtering
        if self.filter_timestamp_from or self.filter_timestamp_to:
            timestamp_filter = {
                "operator": "range",
                "value": {}
            }
            if self.filter_timestamp_from:
                timestamp_filter["value"]["from"] = self.filter_timestamp_from
            if self.filter_timestamp_to:
                timestamp_filter["value"]["to"] = self.filter_timestamp_to
            filters["timestamp"] = timestamp_filter

        return filters if filters else None
