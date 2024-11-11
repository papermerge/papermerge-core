import logging
import uuid
from typing import Annotated

from sqlalchemy.exc import NoResultFound

from fastapi import APIRouter, HTTPException, Security, Depends
from fastapi.responses import FileResponse

from papermerge.core.constants import ContentType
from papermerge.core import schema, utils, db, dbapi, orm
from papermerge.core.db import exceptions as db_exc
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/document-versions", tags=["document-versions"])


class PDFFileResponse(FileResponse):
    media_type = ContentType.APPLICATION_PDF
    content_disposition = "attachment"


@router.get("/{document_version_id}/download", response_class=PDFFileResponse)
@utils.docstring_parameter(scope=scopes.DOCUMENT_DOWNLOAD)
def download_document_version(
    document_version_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.DOCUMENT_DOWNLOAD])
    ],
):
    """Downloads given document version

    Required scope: `{scope}`
    """
    try:
        with db.Session() as db_session:
            doc_ver: orm.DocumentVersion = dbapi.get_doc_ver(
                db_session,
                document_version_id=document_version_id,
                user_id=user.id,
            )
    except NoResultFound:
        error = schema.Error(messages=["Document version not found"])
        raise HTTPException(status_code=404, detail=error.model_dump())

    if not doc_ver.file_path.exists():
        error = schema.Error(messages=["Document version file not found"])
        raise HTTPException(status_code=404, detail=error.model_dump())

    return PDFFileResponse(
        doc_ver.file_path,
        filename=doc_ver.file_name,
        content_disposition_type="attachment",
    )


@router.get("/{document_version_id}", response_model=schema.DocumentVersion)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def document_version_details(
    document_version_id: uuid.UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
):
    """Get document version details

    Required scope: `{scope}`
    """
    try:
        with db.Session() as db_session:
            doc_ver: orm.DocumentVersion = dbapi.get_doc_ver(
                db_session, document_version_id=document_version_id, user_id=user.id
            )
    except NoResultFound:
        error = schema.Error(messages=["Page not found"])
        raise HTTPException(status_code=404, detail=error.model_dump())

    return schema.DocumentVersion.model_validate(doc_ver)
