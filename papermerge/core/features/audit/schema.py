import uuid
from datetime import datetime
from typing import Optional, Dict, Any, Literal

from fastapi import Query
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
        regex="^(timestamp|operation|table_name|username|record_id|user_id|id)$",
        description="Column to sort by: timestamp, operation, table_name, username, record_id, user_id, id"
    )
    sort_direction: Optional[Literal["asc", "desc"]] = Query(
        None,
        description="Sort direction: asc or desc"
    )

    # Filter parameters - individual query parameters
    filter_operation: Optional[Literal["INSERT", "UPDATE", "DELETE"]] = Query(
        None,
        description="Filter by operation type: INSERT, UPDATE, or DELETE"
    )
    filter_table_name: Optional[str] = Query(
        None,
        description="Filter by table name (partial match, case-insensitive)"
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
        description="Filter from timestamp (ISO format: 2025-08-20T06:35:10Z)"
    )
    filter_timestamp_to: Optional[str] = Query(
        None,
        description="Filter to timestamp (ISO format: 2025-08-21T06:35:10Z)"
    )

    def to_advanced_filters(self) -> Optional[Dict[str, Dict[str, Any]]]:
        """
        Convert simple filter parameters to advanced filter format
        for use with get_audit_logs_advanced function.
        """
        filters = {}

        if self.filter_operation:
            filters["operation"] = {
                "value": self.filter_operation,
                "operator": "equals"
            }

        if self.filter_table_name:
            filters["table_name"] = {
                "value": self.filter_table_name,
                "operator": "contains"
            }

        if self.filter_username:
            filters["username"] = {
                "value": self.filter_username,
                "operator": "contains"
            }

        if self.filter_user_id:
            filters["user_id"] = {
                "value": self.filter_user_id,
                "operator": "equals"
            }

        if self.filter_record_id:
            filters["record_id"] = {
                "value": self.filter_record_id,
                "operator": "contains"
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
