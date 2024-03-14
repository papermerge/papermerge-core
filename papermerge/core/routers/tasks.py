from typing import Annotated

from celery.result import AsyncResult
from fastapi import APIRouter, Security

from papermerge.core import schemas, utils
from papermerge.core.auth import get_current_user, scopes
from papermerge.core.models import Document
from papermerge.core.schemas.tasks import OCRTaskIn, OCRTaskOut
from papermerge.core.tasks import ocr_document_task

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

    async_result: AsyncResult = ocr_document_task.apply_async(
        kwargs={
            'document_id': str(doc.id),
            'lang': ocr_task.lang,
            'user_id': str(user.id)
        }
    )

    task_out = OCRTaskOut(
        task_id=async_result.task_id
    )

    return task_out
