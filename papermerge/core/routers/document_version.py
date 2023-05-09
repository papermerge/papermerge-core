import logging
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from papermerge.core.models import User, DocumentVersion


from .auth import oauth2_scheme
from .auth import get_current_user as current_user


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/document-versions",
    tags=["document-versions"],
    dependencies=[Depends(oauth2_scheme)]
)


class PDFFileResponse(FileResponse):
    media_type = 'application/pdf'


@router.get("/{document_version_id}/download", response_class=PDFFileResponse)
def download_document_version(
    document_version_id: uuid.UUID,
    user: User = Depends(current_user)
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

    file_abs_path = doc_ver.abs_file_path()

    if not os.path.exists(file_abs_path):
        raise HTTPException(
            status_code=404,
            detail="Document version file not found"
        )

    return PDFFileResponse(file_abs_path)
