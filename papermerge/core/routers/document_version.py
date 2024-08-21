import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Security, Depends
from fastapi.responses import FileResponse

from papermerge.core import schemas, utils, db
from papermerge.core.db import exceptions as db_exc
from papermerge.core.auth import get_current_user, scopes
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
@utils.docstring_parameter(scope=scopes.DOCUMENT_DOWNLOAD)
def download_document_version(
    document_version_id: uuid.UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.DOCUMENT_DOWNLOAD])
    ]
):
    """Downloads given document version

    Required scope: `{scope}`
    """
    try:
        doc_ver = DocumentVersion.objects.get(
            id=document_version_id, document__user=user.id
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


@router.get("/{document_version_id}", response_model=schemas.DocumentVersion)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def document_version_details(
    document_version_id: uuid.UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    engine: db.Engine = Depends(db.get_engine)
):
    """Get document version details

    Required scope: `{scope}`
    """
    try:
        doc_ver = db.get_doc_ver(
            engine,
            id=document_version_id,
            user_id=user.id
        )
    except db_exc.PageNotFound:
        raise HTTPException(
            status_code=404,
            detail="Page not found"
        )

    return doc_ver
