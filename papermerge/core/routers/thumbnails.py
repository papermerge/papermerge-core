import logging
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from papermerge.core.models import Document, User
from papermerge.core.schemas.documents import Thumbnail
from papermerge.core.storage import abs_path

from .auth import get_current_user as current_user

router = APIRouter(
    prefix="/thumbnails",
    tags=["thumbnails"],
)

logger = logging.getLogger(__name__)


@router.post("/{document_id}/generate")
def generate_document_thumbnail(
    document_id: uuid.UUID,
    size: int = 200,
    user: User = Depends(current_user)
) -> Thumbnail:
    """Generates thumbnail of the document last version's first page

    Thumbnail is size px wide.
    """
    try:
        doc = Document.objects.get(id=document_id, user=user)
    except Document.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Document does not exist"
        )

    jpeg_abs_path = abs_path(doc.thumbnail_path(size=size))

    if not os.path.exists(jpeg_abs_path):
        # generate preview/thumbnail
        # of the doc last version's first page
        doc.generate_thumbnail(size=size)

    return Thumbnail(
        size=size,
        url=f"api/thumbnails/{document_id}?size={size}"
    )


class JPEGFileResponse(FileResponse):
    media_type = 'application/jpeg'


@router.get(
    "/{document_id}",
    response_class=JPEGFileResponse
)
def retrieve_document_thumbnail(
    document_id: uuid.UUID,
    size: int = 200,
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

    jpeg_abs_path = abs_path(doc.thumbnail_path(size=size))
    logger.info(f"jpeg_abs_path={jpeg_abs_path}")

    if not os.path.exists(jpeg_abs_path):
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return JPEGFileResponse(jpeg_abs_path)
