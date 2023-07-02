import logging
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from papermerge.core.constants import DEFAULT_THUMBNAIL_SIZE
from papermerge.core.models import Document, User
from papermerge.core.pathlib import rel2abs, thumbnail_path

from .auth import get_current_user as current_user

router = APIRouter(
    prefix="/thumbnails",
    tags=["thumbnails"],
)

logger = logging.getLogger(__name__)


class JPEGFileResponse(FileResponse):
    media_type = 'application/jpeg'


@router.get(
    "/{document_id}",
    response_class=JPEGFileResponse
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
    jpeg_abs_path = rel2abs(
        thumbnail_path(first_page.id, size=size)
    )

    if not os.path.exists(jpeg_abs_path):
        first_page.generate_thumbnail(size=size)

    return JPEGFileResponse(jpeg_abs_path)
