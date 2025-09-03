import logging
import uuid
import math
from typing import Optional, Dict, Any
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc, String as db_String

from papermerge.core import schema, orm

logger = logging.getLogger(__name__)

ALLOWED_SORT_COLUMNS = {
    'timestamp', 'operation', 'table_name', 'username'
}

ALLOWED_FILTER_COLUMNS = {
    'username',
    'user_id',
    'table_name',
    'operation',
    'timestamp',
    'record_id',
    'id'
}

async def get_audit_log(
    db_session: AsyncSession,
    audit_log_id: uuid.UUID
) -> schema.AuditLogDetails:

    stmt = (
        select(orm.AuditLog)
        .where(orm.AuditLog.id == audit_log_id)
    )
    db_item = (await db_session.scalars(stmt)).unique().one()

    result = schema.AuditLogDetails.model_validate(db_item)

    return result


async def get_audit_logs(
    db_session: AsyncSession,
    *,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filters: Optional[Dict[str, Dict[str, Any]]] = None
) -> schema.PaginatedResponse[schema.AuditLog]:
    base_query = select(orm.AuditLog)
    count_query = select(func.count(orm.AuditLog.id))

    if sort_by and sort_by not in ALLOWED_SORT_COLUMNS:
        raise ValueError(f"Invalid sort column: {sort_by}")

    if filters:
        filter_conditions = []

        for column, filter_data in filters.items():
            if not isinstance(filter_data, dict):
                continue

            if column not in ALLOWED_FILTER_COLUMNS:
                continue

            value = filter_data.get("value")
            operator = filter_data.get("operator", "contains")

            if value is None:
                continue

            if column == "free_text":
                filter_conditions.append(
                    or_(
                        func.cast(orm.AuditLog.record_id, db_String).ilike(f"%{value}%"),
                        func.cast(orm.AuditLog.user_id, db_String).ilike(f"%{value}%"),
                        func.cast(orm.AuditLog.id, db_String).ilike(f"%{value}%"),
                        orm.AuditLog.username.ilike(f"%{value}%"),
                        orm.AuditLog.table_name.ilike(f"%{value}%"),
                        orm.AuditLog.operation.ilike(f"%{value.lower()}%")
                    )
                )
            elif column in ALLOWED_FILTER_COLUMNS:
                column_attr = getattr(orm.AuditLog, column)
                if operator == "in" and isinstance(value, list):
                    filter_conditions.append(column_attr.in_(value))
                elif operator == "in" and isinstance(value, str):
                    filter_conditions.append(column_attr.in_(value.split(",")))
                elif column == "timestamp" and operator == "range" and isinstance(value, dict):
                    if "from" in value and value["from"]:
                        try:
                            date_from = datetime.fromisoformat(value["from"].replace('Z', '+00:00'))
                            filter_conditions.append(column_attr >= date_from)
                        except ValueError:
                            pass

                    if "to" in value and value["to"]:
                        try:
                            date_to = datetime.fromisoformat(value["to"].replace('Z', '+00:00'))
                            filter_conditions.append(column_attr <= date_to)
                        except ValueError:
                            pass

        if filter_conditions:
            filter_clause = and_(*filter_conditions)
            base_query = base_query.where(filter_clause)
            count_query = count_query.where(filter_clause)

    # Get total count
    total_audit_logs = (await db_session.execute(count_query)).scalar() or 0

    # Apply sorting
    if sort_by and hasattr(orm.AuditLog, sort_by):
        column_attr = getattr(orm.AuditLog, sort_by)
        if sort_direction == "desc":
            base_query = base_query.order_by(desc(column_attr))
        else:
            base_query = base_query.order_by(asc(column_attr))
    else:
        base_query = base_query.order_by(desc(orm.AuditLog.timestamp))

    # Apply pagination
    offset = page_size * (page_number - 1)
    base_query = base_query.limit(page_size).offset(offset)

    # Execute and return
    db_audit_logs = (await db_session.scalars(base_query)).all()
    items = []
    for db_audit_log in db_audit_logs:
        item = schema.AuditLog.model_validate(db_audit_log)
        items.append(item)

    total_pages = math.ceil(total_audit_logs / page_size) if total_audit_logs > 0 else 0

    return schema.PaginatedResponse[schema.AuditLog](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages,
        total_items=total_audit_logs
    )
