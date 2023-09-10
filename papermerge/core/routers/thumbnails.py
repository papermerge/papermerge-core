import logging
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from papermerge.core.constants import DEFAULT_THUMBNAIL_SIZE
from papermerge.core.models import Document, User
from papermerge.core.pathlib import rel2abs, thumbnail_path

from .auth import get_current_user as current_user

router = APIRouter(
    prefix="/thumbnails",
    tags=["thumbnails"],
)

logger = logging.getLogger(__name__)


class Message(BaseModel):
    detail: str


class JPEGFileResponse(FileResponse):
    media_type = 'application/jpeg'


OPEN_API_GENERIC_JSON_DETAIL = {
    "application/json": {
        "schema": {
            "type": "object",
            "properties": {
                "detail": {
                    "type": "string"
                }
            }
        },
        "example": {
            "detail": "Status code message detail"
        }
    }
}


@router.get(
    "/{document_id}",
    response_class=JPEGFileResponse,
    responses={
        309: {
            "description": """Preview image cannot be generated at this moment
             yet. This may happen for example because the document is currently
            still being uploaded. A later response may succeed with 200 status
            code.""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        },
        404: {
            "description": """Document with specified UUID was not found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        }
    }
)
def retrieve_document_thumbnail(
    document_id: uuid.UUID,
    size: int = DEFAULT_THUMBNAIL_SIZE,
    user: User = Depends(current_user)
):
    """Retrieves thumbnail of the document last version's first page"""
    try:
        doc = Document.objects.get(id=document_id, user=user)
    except Document.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Page does not exist"
        )

    last_version = doc.versions.last()
    first_page = last_version.pages.first()

    if first_page is None:
        # may happen e.g. when document is still being uploaded
        raise HTTPException(
            status_code=309,
            detail="Not ready for preview yet"
        )

    jpeg_abs_path = rel2abs(
        thumbnail_path(first_page.id, size=size)
    )

    if not os.path.exists(jpeg_abs_path):
        first_page.generate_thumbnail(size=size)

    return JPEGFileResponse(jpeg_abs_path)
