from typing import Annotated

from celery import current_app
from celery.result import AsyncResult
from fastapi import APIRouter, Security

from papermerge.core import constants, schemas, utils
from papermerge.core.auth import get_current_user, scopes
from papermerge.core.models import Document
from papermerge.core.schemas.tasks import OCRTaskIn, OCRTaskOut

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)


@router.post("/ocr")
@utils.docstring_parameter(scope=scopes.TASK_OCR)
def start_ocr(
    ocr_task: OCRTaskIn,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TASK_OCR])
    ],
) -> OCRTaskOut:
    """Triggers OCR for specific document

    Required scope: `{scope}`
    """
    doc = Document.objects.get(id=ocr_task.id)

    async_result: AsyncResult = current_app.send_task(
        constants.WORKER_OCR_DOCUMENT,
        kwargs={
            'document_id': str(doc.id),
            'lang': ocr_task.lang,
        },
        route_name='ocr'
    )

    task_out = OCRTaskOut(
        task_id=async_result.task_id
    )

    return task_out
