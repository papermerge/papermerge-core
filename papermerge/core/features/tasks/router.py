from typing import Annotated

from fastapi import APIRouter, Depends, Security
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import constants, schema, utils, exceptions as exc
from papermerge.core.features.auth import get_current_user, scopes
from papermerge.core import tasks
from papermerge.core.db import common as dbapi_common
from papermerge.core.db.engine import get_db

from .schema import OCRTaskIn

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)


@router.post("/ocr")
@utils.docstring_parameter(scope=scopes.TASK_OCR)
async def start_ocr(
    ocr_task: OCRTaskIn,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.TASK_OCR])],
    db_session: AsyncSession = Depends(get_db),
):
    """Triggers OCR for specific document

    Required scope: `{scope}`
    """
    if not await dbapi_common.has_node_perm(
        db_session,
        node_id=ocr_task.document_id,
        codename=scopes.NODE_UPDATE,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    tasks.send_task(
        constants.WORKER_OCR_DOCUMENT,
        kwargs={
            "document_id": str(ocr_task.document_id),
            "lang": ocr_task.lang,
        },
        route_name="ocr",
    )
