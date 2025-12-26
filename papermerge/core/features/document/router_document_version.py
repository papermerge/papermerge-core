import logging
import uuid

from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, HTTPException, Depends, status

from papermerge.core import schema, dbapi, orm, scopes, db
from papermerge.core.features.auth.scopes import Scopes
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core import exceptions as exc
from papermerge.core.db.engine import get_db
from papermerge.core.features.document.response import DocumentFileResponse
from papermerge.core.features.audit.db.audit_context import AsyncAuditContext

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/document-versions", tags=["document-versions"])


@router.api_route(
    "/{document_version_id}/download",
    methods=["GET", "HEAD"],
    response_class=DocumentFileResponse,
    status_code=200,
    responses={
        200: {
            "description": "Binary file download",
            "content": {
                "application/octet-stream": {},
                "application/pdf": {},
                "image/png": {},
                "image/jpeg": {},
                "image/tiff": {}
            }
        },
        404: {
            "description": "Document version not found"
        }
    }
)
async def download_document_version(
    document_version_id: uuid.UUID,
    user: scopes.DownloadDocument,
    db_session: AsyncSession = Depends(get_db),
):
    """Downloads given document version"""
    try:
        doc_id = await dbapi.get_doc_id_from_doc_ver_id(
            db_session, doc_ver_id=document_version_id
        )
        if not await db.has_node_perm(
                db_session,
                node_id=doc_id,
                codename=Scopes.NODE_VIEW,
                user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        doc_ver: orm.DocumentVersion = await dbapi.get_doc_ver(
            db_session,
            document_version_id=document_version_id,
        )
    except NoResultFound:
        error = schema.Error(messages=["Document version not found"])
        raise HTTPException(status_code=404, detail=error.model_dump())

    if not doc_ver.file_path.exists():
        error = schema.Error(messages=["Document version file not found"])
        raise HTTPException(status_code=404, detail=error.model_dump())

    return DocumentFileResponse(
        doc_ver.file_path,
        filename=doc_ver.file_name,  # Will be in Content-Disposition header
        content_disposition_type="attachment"
    )

@router.get(
    "/{doc_ver_id}/download-url",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{Scopes.DOCUMENT_DOWNLOAD}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def get_doc_ver_download_url(
    doc_ver_id: uuid.UUID,
    user: scopes.DownloadDocument,
    db_session: AsyncSession = Depends(get_db),
) -> schema.DownloadURL:
    """
    Returns URL for downloading given document version

    For this action user requires "node.view" permission as well.
    """
    try:
        doc_id = await dbapi.get_doc_id_from_doc_ver_id(
            db_session, doc_ver_id=doc_ver_id
        )
        if not await db.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=Scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        result = await dbapi.get_doc_version_download_url(
            db_session,
            doc_ver_id=doc_ver_id,
        )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    return result



@router.get(
    "/{document_version_id}",
    response_model=schema.DocumentVersion
)
async def document_version_details(
    document_version_id: uuid.UUID,
    user: scopes.ViewNode,
    db_session=Depends(get_db),
):
    """Get document version details"""
    try:
        doc_id = await dbapi.get_doc_id_from_doc_ver_id(
            db_session, doc_ver_id=document_version_id
        )
        if not await db.has_node_perm(
                db_session,
                node_id=doc_id,
                codename=Scopes.NODE_VIEW,
                user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()
        doc_ver: orm.DocumentVersion = await dbapi.get_doc_ver(
            db_session, document_version_id=document_version_id
        )
    except NoResultFound:
        error = schema.Error(messages=["Page not found"])
        raise HTTPException(status_code=404, detail=error.model_dump())

    return schema.DocumentVersion.model_validate(doc_ver)


@router.get(
    "/{doc_ver_id}/lang",
    response_model=schema.DocVerLang,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{Scopes.NODE_VIEW}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        status.HTTP_404_NOT_FOUND: {
            "description": "Document version not found",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def get_doc_ver_lang(
    doc_ver_id: uuid.UUID,
    user: scopes.ViewNode,
    db_session: AsyncSession = Depends(get_db),
) -> schema.DocVerLang:
    """Returns the lang attribute of the document version"""
    try:
        doc_id = await dbapi.get_doc_id_from_doc_ver_id(
            db_session, doc_ver_id=doc_ver_id
        )
        if not await db.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=Scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        lang = await db.get_doc_ver_lang(
            db_session,
            doc_ver_id=doc_ver_id,
        )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    return schema.DocVerLang(lang=lang)


@router.patch(
    "/{doc_ver_id}/lang",
    response_model=schema.DocVerLang,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{Scopes.NODE_UPDATE}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        status.HTTP_404_NOT_FOUND: {
            "description": "Document version not found",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def set_doc_ver_lang(
    doc_ver_id: uuid.UUID,
    payload: schema.UpdateDocVerLang,
    user: scopes.UpdateNode,
    db_session: AsyncSession = Depends(get_db),
) -> schema.DocVerLang:
    """Sets the lang attribute of the document version."""
    try:
        doc_id = await dbapi.get_doc_id_from_doc_ver_id(
            db_session, doc_ver_id=doc_ver_id
        )
        if not await db.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=Scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            lang = await db.set_doc_ver_lang(
                db_session,
                doc_ver_id=doc_ver_id,
                lang=payload.lang,
                updated_by=user.id
            )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    return schema.DocVerLang(lang=lang)
