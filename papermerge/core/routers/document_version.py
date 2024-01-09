import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from papermerge.core import schemas
from papermerge.core.auth import get_current_user
from papermerge.core.models import DocumentVersion

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/document-versions",
    tags=["document-versions"]
)


class PDFFileResponse(FileResponse):
    media_type = 'application/pdf'
    content_disposition = 'attachment'


@router.get("/{document_version_id}/download", response_class=PDFFileResponse)
def download_document_version(
    document_version_id: uuid.UUID,
    user: schemas.User = Depends(get_current_user)
):
    try:
        doc_ver = DocumentVersion.objects.get(
            id=document_version_id, document__user=user
        )
    except DocumentVersion.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Document version not found"
        )

    if not doc_ver.file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Document version file not found"
        )

    return PDFFileResponse(
        doc_ver.file_path,
        filename=doc_ver.file_name,
        content_disposition_type='attachment'
    )
