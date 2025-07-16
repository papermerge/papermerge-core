import io
import logging
import uuid
from typing import Annotated

from fastapi import (
    APIRouter,
    HTTPException,
    Security,
    UploadFile,
    status,
    Query,
    Depends,
)
from sqlalchemy.exc import NoResultFound

from papermerge.core import exceptions as exc
from papermerge.core import constants as const
from papermerge.core import utils, db, dbapi, schema
from papermerge.core.features.auth import get_current_user, scopes
from papermerge.core.features.document.schema import (
    DocumentTypeArg,
    PageNumber,
    PageSize,
    OrderBy,
)
from papermerge.core.config import get_settings, FileServer
from papermerge.core.tasks import send_task
from papermerge.core.types import OrderEnum, PaginatedResponse
from papermerge.core.db import common as dbapi_common
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)

logger = logging.getLogger(__name__)
config = get_settings()


@router.patch(
    "/{document_id}/custom-fields",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_UPDATE}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_document_custom_field_values(
    document_id: uuid.UUID,
    custom_fields_update: list[schema.DocumentCustomFieldsUpdate],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
    db_session=Depends(db.get_db),
) -> list[schema.CFV]:
    """
    Update document's custom fields
    Required scope: `{scope}`
    """
    custom_fields = {}
    for cf in custom_fields_update:
        if cf.value is None and cf.custom_field_value_id is None:
            continue
        custom_fields[cf.key] = cf.value

    if not dbapi_common.has_node_perm(
        db_session,
        node_id=document_id,
        codename=scopes.NODE_UPDATE,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    try:
        updated_entries = dbapi.update_doc_cfv(
            db_session,
            document_id=document_id,
            custom_fields=custom_fields,
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
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_VIEW}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_document_custom_field_values(
    document_id: uuid.UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    db_session=Depends(db.get_db),
) -> list[schema.CFV]:
    """
    Get document custom field values

    Required scope: `{scope}`
    """
    if not dbapi_common.has_node_perm(
        db_session,
        node_id=document_id,
        codename=scopes.NODE_VIEW,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    try:
        doc = dbapi.get_doc_cfv(
            db_session,
            document_id=document_id,
        )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    return doc


@router.post(
    "/{document_id}/upload",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.DOCUMENT_UPLOAD}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.DOCUMENT_UPLOAD)
def upload_file(
    document_id: uuid.UUID,
    file: UploadFile,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.DOCUMENT_UPLOAD])
    ],
    db_session=Depends(db.get_db),
) -> schema.Document:
    """
    Uploads document's file.

    Required scope: `{scope}`

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

    if not dbapi_common.has_node_perm(
        db_session,
        node_id=document_id,
        codename=scopes.DOCUMENT_UPLOAD,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    doc, error = dbapi.upload(
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
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_document_last_version(
    doc_id: uuid.UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    db_session=Depends(db.get_db),
) -> schema.DocumentVersion:
    """
    Returns document's last version

    Required scope: `{scope}`
    """
    try:
        if not dbapi_common.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        result = dbapi.get_last_doc_ver(
            db_session,
            doc_id=doc_id,
        )
    except NoResultFound:
        raise exc.HTTP404NotFound()

    return result


@router.get(
    "/{doc_id}/versions/",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_VIEW}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_doc_versions_list(
    doc_id: uuid.UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    db_session=Depends(db.get_db),
) -> list[schema.DocVerListItem]:
    """
    Returns versions list for given document ID

    Returned versions are sorted descending by version number.

    Required scope: `{scope}`
    """
    try:
        if not dbapi_common.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        result = dbapi.get_doc_versions_list(
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
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_document_details(
    document_id: uuid.UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    db_session=Depends(db.get_db),
) -> schema.DocumentWithoutVersions:
    """
    Get document details

    Required scope: `{scope}`
    """
    try:
        if not dbapi_common.has_node_perm(
            db_session,
            node_id=document_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        doc = dbapi.get_doc(db_session, id=document_id)
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
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_document_type(
    document_id: uuid.UUID,
    document_type: DocumentTypeArg,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    db_session=Depends(db.get_db),
):
    """
    Updates document type

    Required scope: `{scope}`
    """
    try:
        if not dbapi_common.has_node_perm(
            db_session,
            node_id=document_id,
            codename=scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        dbapi.update_doc_type(
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


@router.get("/type/{document_type_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_documents_by_type(
    document_type_id: uuid.UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    page_size: PageSize = 5,
    page_number: PageNumber = 1,
    order_by: OrderBy = None,
    order: OrderEnum = OrderEnum.desc,
    db_session=Depends(db.get_db),
) -> PaginatedResponse[schema.DocumentCFV]:
    """
    Get all documents of specific type with all custom field values

    Required scope: `{scope}`
    """
    items = dbapi.get_docs_by_type(
        db_session,
        type_id=document_type_id,
        user_id=user.id,
        order_by=order_by,
        order=order,
        page_number=page_number,
        page_size=page_size,
    )
    total_count = dbapi.get_docs_count_by_type(db_session, type_id=document_type_id)

    return PaginatedResponse(
        page_size=page_size,
        page_number=page_number,
        num_pages=int(total_count / page_size) + 1,
        items=items,
    )


@router.get(
    "/thumbnail-img-status/",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_VIEW}` permission on one of the documents",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_document_doc_thumbnail_status(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    doc_ids: list[uuid.UUID] = Query(),
    db_session=Depends(db.get_db),
) -> list[schema.DocumentPreviewImageStatus]:
    """
    Get documents thumbnail image preview status

    Receives as input a list of document IDs (i.e. node IDs).

    In case of CDN setup, for each document with NULL value in `preview_status`
    field - one `S3worker` task will be scheduled for generating respective
    document thumbnail.

    Required scope: `{scope}`
    """

    for doc_id in doc_ids:
        if not dbapi_common.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

    response, doc_ids_not_yet_considered = dbapi.get_docs_thumbnail_img_status(
        db_session, doc_ids=doc_ids
    )

    fserver = config.papermerge__main__file_server
    if fserver == FileServer.S3.value:
        if len(doc_ids_not_yet_considered) > 0:
            for doc_id in doc_ids_not_yet_considered:
                send_task(
                    const.S3_WORKER_GENERATE_DOC_THUMBNAIL,
                    kwargs={"doc_id": str(doc_id)},
                    route_name="s3preview",
                )

    return response
