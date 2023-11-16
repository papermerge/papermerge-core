from celery.result import AsyncResult
from fastapi import APIRouter, Depends

from papermerge.core.models import Document, User
from papermerge.core.routers.auth import get_current_user as current_user
from papermerge.core.schemas.tasks import OCRTaskIn, OCRTaskOut
from papermerge.core.tasks import ocr_document_task

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)


@router.post("/ocr")
def start_ocr(
    ocr_task: OCRTaskIn,
    user: User = Depends(current_user)
) -> OCRTaskOut:
    """Triggers OCR for specific document
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
