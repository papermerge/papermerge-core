import logging
import math
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, orm

logger = logging.getLogger(__name__)


async def get_audit_log(
    db_session: AsyncSession,
    audit_log_id: uuid.UUID
) -> schema.AuditLog:

    stmt = (
        select(orm.AuditLog)
        .where(orm.AuditLog.id == audit_log_id)
    )
    db_item = (await db_session.scalars(stmt)).unique().one()

    result = schema.AuditLog.model_validate(db_item)

    return result


async def get_audit_logs(
    db_session: AsyncSession, *, page_size: int, page_number: int
) -> schema.PaginatedResponse[schema.AuditLog]:
    stmt_total_users = select(func.count(orm.AuditLog.id))
    total_roles = (await db_session.execute(stmt_total_users)).scalar()

    offset = page_size * (page_number - 1)
    stmt = select(orm.AuditLog).limit(page_size).offset(offset)

    db_audit_logs = (await db_session.scalars(stmt)).all()
    items = [schema.AuditLog.model_validate(db_role) for db_role in db_audit_logs]

    total_pages = math.ceil(total_roles / page_size)

    return schema.PaginatedResponse[schema.AuditLog](
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )
