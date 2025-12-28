import io
import logging
import uuid
from typing import Any

from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
    status,
    Query,
    Depends,
    Form
)
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.auth.dependencies import require_scopes
from papermerge.core import exceptions as exc
from papermerge.core import constants as const
from papermerge.core import dbapi
from papermerge.core.features.auth import scopes
from papermerge.core.features.document.schema import (
    DocumentTypeArg,
)
from papermerge.core import schema
from papermerge.core.config import get_settings, FileServer
from papermerge.core.tasks import send_task
from papermerge.core.features.nodes.db import api as nodes_dbapi
from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.db import common as dbapi_common
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.db.engine import get_db
from papermerge.core.features.audit.db.audit_context import AsyncAuditContext
from .schema import DocumentParams
from .mime_detection import (
    UnsupportedFileTypeError,
    InvalidFileError,
    detect_and_validate_mime_type,
)

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)

logger = logging.getLogger(__name__)
config = get_settings()


@router.get("/")
async def get_documents(
    user: require_scopes(scopes.NODE_VIEW),
    params: DocumentParams = Depends(),
    db_session: AsyncSession = Depends(get_db)
) -> schema.PaginatedResponse[schema.FlatDocument]:
    """Gets paginated list of documents"""
    try:
        filters = params.to_filters()
        result = await dbapi.get_documents(
            db_session,
            user_id=user.id,
            page_size=params.page_size,
            page_number=params.page_number,
            sort_by=params.sort_by,
            sort_direction=params.sort_direction,
            filters=filters
        )
    except Exception as e:
        logger.error(
            f"Error fetching documents by the user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

    return result


@router.patch(
    "/{document_id}/custom-fields/values/bulk",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_UPDATE}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def bulk_set_document_custom_field_values(
    document_id: uuid.UUID,
    values: dict[uuid.UUID, Any],
    user: require_scopes(scopes.NODE_UPDATE),
    db_session: AsyncSession = Depends(get_db),
) -> list[schema.CustomFieldValue]:
    """Update document's custom fields"""
    if not await dbapi_common.has_node_perm(
        db_session,
        node_id=document_id,
        codename=scopes.NODE_UPDATE,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    try:
        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            updated_entries = await dbapi.bulk_set_custom_field_values(
                db_session,
                document_id=document_id,
                values=values
            )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    send_task(
        const.PATH_TMPL_MOVE_DOCUMENT,
        kwargs={"document_id": str(document_id)},
        route_name="path_tmpl",
    )

    return updated_entries


@router.get(
    "/{document_id}/custom-fields",
    response_model=list[schema.CustomFieldWithValue],
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_VIEW}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def get_document_custom_field_values(
    document_id: uuid.UUID,
    user: require_scopes(scopes.NODE_VIEW),
    db_session: AsyncSession = Depends(get_db),
) -> list[schema.CustomFieldWithValue]:
    """Get document custom field values"""
    if not await dbapi_common.has_node_perm(
        db_session,
        node_id=document_id,
        codename=scopes.NODE_VIEW,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    try:
        doc = await dbapi.get_document_custom_field_values(
            db_session,
            document_id=document_id,
        )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    return doc


@router.post(
    "/upload",
    status_code=201,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_CREATE}` or `{scopes.DOCUMENT_UPLOAD}` permission",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def upload_document(
    user: require_scopes(scopes.NODE_CREATE, scopes.DOCUMENT_UPLOAD),
    file: UploadFile,
    title: str | None = Form(None),
    parent_id: uuid.UUID | None = Form(None),
    document_id: uuid.UUID | None = Form(None),
    ocr: bool = Form(False),
    lang: str | None = Form(None),
    db_session: AsyncSession = Depends(get_db),
) -> schema.Document:
    """
    Creates a document model and uploads file in same time.

    Usage with cURL:

            $ curl <server url>/api/documents/upload -F "file=@booking.pdf"
                -F "title=coco.pdf"
                -F "lang=eng"
                -F "parent_id=<UUID of parent folder>"

    The only required field is `file`:

            $ curl <server url>/api/documents/upload -F "file=@booking.pdf"

    If parent_id is not provided, the document will be uploaded to the user's inbox.
    If title is not provided, the filename will be used as the title.
    User needs as well `NODE_VIEW` permission on the parent folder.
    (Users of course have `NODE_VIEW` permission on their own inbox folder)
    """
    if parent_id is None:
        parent_id = user.inbox_folder_id

    if not title:
        title = file.filename

    # Check permission on parent
    if not await dbapi_common.has_node_perm(
        db_session,
        node_id=parent_id,
        codename=scopes.NODE_VIEW,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    # At this point user has
    # 1. NODE_VIEW perm on the parent node
    # 2. CREATE_NODE and DOCUMENT_UPLOAD perms

    # Use user's default language if not specified
    if lang is None:
        default_value = config.default_lang
        # take value from user preferences if present or from
        # global application config otherwise
        lang = user.preferences.document_default_lang or default_value

    # Read file content
    content = await file.read()
    client_content_type=file.headers.get("content-type")

    # Detect and validate mime type
    try:
        mime_type = detect_and_validate_mime_type(
            content,
            file.filename,
            client_content_type=client_content_type,
            validate_structure=True  # Always validate for uploads
        )
    except UnsupportedFileTypeError as e:
        logger.warning(f"Unsupported file type for '{file.filename}': {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {e}"
        )

    except InvalidFileError as e:
        logger.warning(f"Invalid file structure for '{file.filename}': {e}")
        raise HTTPException(
            status_code=400,  # Payload Too Large
            detail=f"File is corrupted or invalid: {e}"
        )

    max_file_size = config.max_file_size_mb * 1024 * 1024
    if len(content) > max_file_size:
        raise HTTPException(
            status_code=413,  # Payload Too Large
            detail=f"File too large. Maximum size is {max_file_size / (1024*1024)}MB"
        )

    # Create document node
    new_document = schema.NewDocument(
        title=title,
        lang=lang,
        parent_id=parent_id,
        size=file.size or 0,
        page_count=0,
        ocr=ocr,
        file_name=file.filename or title,
        ctype="document",
        created_by=user.id,
        updated_by=user.id
    )

    if document_id is not None:
        # custom document ID
        new_document.id = document_id

    async with AsyncAuditContext(
        db_session,
        user_id=user.id,
        username=user.username
    ):
        # Step 1: Create document node
        created_node, error = await doc_dbapi.create_document(db_session, new_document, mime_type=mime_type)

        if error:
            raise HTTPException(status_code=400, detail=error.model_dump())

        # Step 2: Upload file content
        doc, upload_error = await dbapi.upload(
            db_session,
            document_id=created_node.id,
            size=file.size or 0,
            content=io.BytesIO(content),
            file_name=file.filename or title,
            content_type=mime_type,
            created_by=user.id
        )

        if upload_error:
            await nodes_dbapi.delete_nodes(
                db_session, node_ids=[created_node.id], user_id=user.id
            )
            raise HTTPException(status_code=400, detail=upload_error.model_dump())

    return doc


@router.post(
    "/{document_id}/upload",
    deprecated=True,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.DOCUMENT_UPLOAD}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def upload_file(
    document_id: uuid.UUID,
    file: UploadFile,
    user: require_scopes(scopes.DOCUMENT_UPLOAD),
    db_session: AsyncSession = Depends(get_db),
) -> schema.Document:
    """

    **DEPRECATED** use `POST /api/documents/upload` instead

    Uploads document's file.

    Document model must be created beforehand via `POST /nodes` endpoint
    provided with `ctype` = `document`.

    In order to upload file cURL:

        $ ls
        booking.pdf

        $ curl <server url>/documents/<uuid>/upload
        --form "file=@booking.pdf;type=application/pdf"
        -H "Authorization: Bearer <your token>"

    Note that `file=` is important and must be exactly that, it is the name
    of the field in `multipart/form-data`. In other words, something like
    '--form "data=@booking.pdf..." won't work.
    The uploaded file is encoded as `multipart/form-data` and is sent
    in POST request body.

    Obviously you can upload files directly via swagger UI.
    """
    content = file.file.read()

    if not await dbapi_common.has_node_perm(
        db_session,
        node_id=document_id,
        codename=scopes.DOCUMENT_UPLOAD,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
    ):
        doc, error = await dbapi.upload(
            db_session,
            document_id=document_id,
            size=file.size,
            content=io.BytesIO(content),
            file_name=file.filename,
            content_type=file.headers.get("content-type"),
        )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return doc


@router.get(
    "/{doc_id}/last-version/",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_VIEW}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def get_document_last_version(
    doc_id: uuid.UUID,
    user: require_scopes(scopes.NODE_VIEW),
    db_session: AsyncSession = Depends(get_db),
) -> schema.DocumentVersion:
    """Returns document's last version"""
    try:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        result = await dbapi.get_last_doc_ver(
            db_session,
            doc_id=doc_id,
        )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    return result


@router.get(
    "/{doc_id}/versions",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_VIEW}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def get_doc_versions_list(
    doc_id: uuid.UUID,
    user: require_scopes(scopes.NODE_VIEW),
    db_session: AsyncSession = Depends(get_db),
) -> list[schema.DocVerListItem]:
    """
    Returns versions list for given document ID

    Returned versions are sorted descending by version number.
    """
    try:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        result = await dbapi.get_doc_versions_list(
            db_session,
            doc_id=doc_id,
        )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    return result


@router.get(
    "/{document_id}",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_VIEW}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def get_document_details(
    document_id: uuid.UUID,
    user: require_scopes(scopes.NODE_VIEW),
    db_session: AsyncSession = Depends(get_db),
) -> schema.DocumentWithoutVersions:
    """Get document details"""
    try:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=document_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        doc = await dbapi.get_doc(db_session, id=document_id, user_id=user.id)
    except NoResultFound:
        raise exc.HTTP404NotFound()
    return doc


@router.patch(
    "/{document_id}/type",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_UPDATE}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def update_document_type(
    document_id: uuid.UUID,
    document_type: DocumentTypeArg,
    user: require_scopes(scopes.NODE_VIEW),
    db_session: AsyncSession = Depends(get_db),
):
    """Updates document type"""
    try:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=document_id,
            codename=scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        async with AsyncAuditContext(
                db_session,
                user_id=user.id,
                username=user.username
        ):
            await dbapi.update_doc_type(
                db_session,
                document_id=document_id,
                document_type_id=document_type.document_type_id,
            )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    send_task(
        const.PATH_TMPL_MOVE_DOCUMENT,
        kwargs={"document_id": str(document_id)},
        route_name="path_tmpl",
    )


@router.get(
    "/type/{document_type_id}/",
    response_model=schema.PaginatedResponse[schema.DocumentCFV]
)
async def get_documents_by_type(
    document_type_id: uuid.UUID,
    user: require_scopes(scopes.NODE_VIEW),
    params: schema.DocumentsByTypeParams = Depends(),
    db_session: AsyncSession = Depends(get_db),
) -> schema.PaginatedResponse[schema.DocumentCFV]:
    """
    Get all documents of specific type with all custom field values
    """
    try:
        result = await dbapi.get_documents_by_type_paginated(
            db_session,
            document_type_id=document_type_id,
            user_id=user.id,
            page_size=params.page_size,
            page_number=params.page_number,
            sort_by=params.sort_by,
            sort_direction=params.sort_direction,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid parameters: {str(e)}"
        )
    except Exception as e:
        logger.error(
            f"Error fetching documents by type for user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

    return result


@router.get(
    "/thumbnail-img-status/",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_VIEW}` permission on one of the documents",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def get_document_doc_thumbnail_status(
    user: require_scopes(scopes.NODE_VIEW),
    doc_ids: list[uuid.UUID] = Query(),
    db_session: AsyncSession = Depends(get_db),
) -> list[schema.DocumentPreviewImageStatus]:
    """
    Get documents thumbnail image preview status

    Receives as input a list of document IDs (i.e. node IDs).

    In case of CDN setup, for each document with NULL value in `preview_status`
    field - one `S3worker` task will be scheduled for generating respective
    document thumbnail.
    """

    for doc_id in doc_ids:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

    response, doc_ids_not_yet_considered = await dbapi.get_docs_thumbnail_img_status(
        db_session, doc_ids=doc_ids
    )

    fserver = config.file_server
    if fserver == FileServer.S3.value:
        if len(doc_ids_not_yet_considered) > 0:
            for doc_id in doc_ids_not_yet_considered:
                send_task(
                    const.S3_WORKER_GENERATE_DOC_THUMBNAIL,
                    kwargs={"doc_id": str(doc_id)},
                    route_name="s3preview",
                )

    return response
