import io
import logging
import uuid
from typing import Annotated

from celery.app import default_app as celery_app
from fastapi import APIRouter, HTTPException, Security, UploadFile
from sqlalchemy.exc import NoResultFound

from papermerge.core import constants as const
from papermerge.core import utils
from papermerge.core.features.auth import get_current_user, scopes
from papermerge.core.db.engine import Session
from papermerge.core.features.document import schema as doc_schema
from papermerge.core.features.document.db import api as dbapi
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.config import get_settings, FileServer
from papermerge.core.utils.decorators import skip_in_tests

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)

logger = logging.getLogger(__name__)
config = get_settings()


@router.patch("/{document_id}/custom-fields")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_document_custom_field_values(
    document_id: uuid.UUID,
    custom_fields_update: list[doc_schema.DocumentCustomFieldsUpdate],
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
) -> list[doc_schema.CFV]:
    """
    Update document's custom fields
    Required scope: `{scope}`
    """
    custom_fields = {}
    for cf in custom_fields_update:
        if cf.value is None and cf.custom_field_value_id is None:
            continue
        custom_fields[cf.key] = cf.value

    with Session() as db_session:
        try:
            updated_entries = dbapi.update_doc_cfv(
                db_session,
                document_id=document_id,
                custom_fields=custom_fields,
            )
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Document not found")

    celery_app.send_task(
        const.PATH_TMPL_MOVE_DOCUMENT,
        kwargs={"document_id": str(document_id), "user_id": str(user.id)},
        route_name="path_tmpl",
    )

    return updated_entries


@router.get("/{document_id}/custom-fields")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_document_custom_field_values(
    document_id: uuid.UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
) -> list[doc_schema.CFV]:
    """
    Get document custom field values

    Required scope: `{scope}`
    """
    with Session() as db_session:
        try:
            doc = dbapi.get_doc_cfv(
                db_session,
                document_id=document_id,
            )
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Document not found")

    return doc


@router.post("/{document_id}/upload")
@utils.docstring_parameter(scope=scopes.DOCUMENT_UPLOAD)
def upload_file(
    document_id: uuid.UUID,
    file: UploadFile,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.DOCUMENT_UPLOAD])
    ],
) -> doc_schema.Document:
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
    with Session() as db_session:
        doc, error = dbapi.upload(
            db_session,
            document_id=document_id,
            size=file.size,
            content=io.BytesIO(content),
            file_name=file.filename,
            content_type=file.headers.get("content-type"),
        )

    if config.papermerge__main__file_server == FileServer.S3:
        # generate preview using `s3_worker`
        # it will, as well, upload previews to s3 storage
        send_task(
            const.S3_WORKER_GENERATE_PREVIEW,
            kwargs={"doc_id": str(doc.id)},
            route_name="s3preview",
        )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return doc


@skip_in_tests
def send_task(*args, **kwargs):
    logger.debug(f"Send task {args} {kwargs}")
    celery_app.send_task(*args, **kwargs)
