import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import utils, schema, dbapi
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.db.engine import get_db
from .schema import AuditLogParams

router = APIRouter(
    prefix="/audit-logs",
    tags=["audit-logs"],
)

logger = logging.getLogger(__name__)


@router.get("/", response_model=schema.PaginatedResponse[schema.AuditLog])
@utils.docstring_parameter(scope=scopes.AUDIT_LOG_VIEW)
async def get_audit_logs(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.AUDIT_LOG_VIEW])],
    params: AuditLogParams = Depends(),
    db_session: AsyncSession = Depends(get_db),
) -> schema.PaginatedResponse[schema.AuditLog]:
    """Get paginated audit logs

    Required scope: `{scope}`
    """
    try:
        advanced_filters = params.to_advanced_filters()

        result = await dbapi.get_audit_logs(
            db_session,
            page_size=params.page_size,
            page_number=params.page_number,
            sort_by=params.sort_by,
            sort_direction=params.sort_direction,
            filters=advanced_filters
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        logger.error(
            f"Error fetching audit logs for user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

    return result


@router.get("/{audit_log_id}", response_model=schema.AuditLogDetails)
@utils.docstring_parameter(scope=scopes.AUDIT_LOG_VIEW)
async def get_audit_log(
    audit_log_id: uuid.UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.AUDIT_LOG_VIEW])],
    db_session: AsyncSession = Depends(get_db),
) -> schema.AuditLogDetails:
    """Get audit log entry details

    Required scope: `{scope}`
    """
    try:
        result = await dbapi.get_audit_log(db_session, audit_log_id=audit_log_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Audit log entry not found")
    except Exception as e:
        logger.error(
            f"Error fetching audit log {audit_log_id} for user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

    return result
