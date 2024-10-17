import io
import uuid
from typing import Annotated

from celery.app import default_app as celery_app
from fastapi import APIRouter, Depends, HTTPException, Query, Security, UploadFile
from pydantic import BaseModel
from sqlalchemy.exc import NoResultFound

from papermerge.conf import settings
from papermerge.core import constants as const
from papermerge.core import db, schemas, utils
from papermerge.core.auth import get_current_user, scopes
from papermerge.core.models import Document
from papermerge.core.types import OrderEnum

OrderBy = Annotated[
    str | None,
    Query(
        description="""
    Name of custom field e.g. 'Total EUR' (without quotes). Note that
    custom field name is case sensitive and may include spaces
"""
    ),
]

PageSize = Annotated[int, Query(ge=1, lt=100, description="Number of items per page")]
PageNumber = Annotated[
    int,
    Query(ge=1, description="Page number. It is first, second etc. page?"),
]

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


class DocumentTypeArg(BaseModel):
    document_type_id: uuid.UUID | None = None


@router.get("/type/{document_type_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_documents_by_type(
    document_type_id: uuid.UUID,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    page_size: PageSize = 5,
    page_number: PageNumber = 1,
    db_session: db.Session = Depends(db.get_session),
    order_by: OrderBy = None,
    order: OrderEnum = OrderEnum.desc,
) -> list[schemas.DocumentCFV]:
    """
    Get all documents of specific type with all custom field values

    Required scope: `{scope}`
    """

    docs = db.get_docs_by_type(
        db_session,
        type_id=document_type_id,
        user_id=user.id,
        order_by=order_by,
        order=order,
        page_number=page_number,
        page_size=page_size,
    )

    return docs


@router.get("/{document_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_document_details(
    document_id: uuid.UUID,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    db_session: db.Session = Depends(db.get_session),
) -> schemas.Document:
    """
    Get document details

    Required scope: `{scope}`
    """
    try:
        doc = db.get_doc(db_session, id=document_id, user_id=user.id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.patch("/{document_id}/custom-fields")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_document_custom_field_values(
    document_id: uuid.UUID,
    custom_fields_update: list[schemas.DocumentCustomFieldsUpdate],
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
    db_session: db.Session = Depends(db.get_session),
) -> list[schemas.CFV]:
    """
    Update document's custom fields
    Required scope: `{scope}`
    """
    custom_fields = {}
    for cf in custom_fields_update:
        if cf.value is None and cf.custom_field_value_id is None:
            continue
        custom_fields[cf.key] = cf.value

    try:
        updated_entries = db.update_doc_cfv(
            db_session,
            document_id=document_id,
            custom_fields=custom_fields,
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document not found")

    return updated_entries


@router.get("/{document_id}/custom-fields")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_document_custom_field_values(
    document_id: uuid.UUID,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    db_session: db.Session = Depends(db.get_session),
) -> list[schemas.CFV]:
    """
    Get document custom field values

    Required scope: `{scope}`
    """
    try:
        doc = db.get_doc_cfv(
            db_session,
            document_id=document_id,
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.patch("/{document_id}/type")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_document_type(
    document_id: uuid.UUID,
    document_type: DocumentTypeArg,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    db_session: db.Session = Depends(db.get_session),
):
    """
    Updates document type

    Required scope: `{scope}`
    """
    try:
        db.update_doc_type(
            db_session,
            document_id=document_id,
            document_type_id=document_type.document_type_id,
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document not found")


@router.post("/{document_id}/upload")
@utils.docstring_parameter(scope=scopes.DOCUMENT_UPLOAD)
def upload_file(
    document_id: uuid.UUID,
    file: UploadFile,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.DOCUMENT_UPLOAD])
    ],
) -> schemas.Document:
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
    doc = Document.objects.get(id=document_id, user_id=user.id)
    content = file.file.read()
    doc.upload(
        size=file.size,
        content=io.BytesIO(content),
        file_name=file.filename,
        content_type=file.headers.get("content-type"),
    )

    if settings.FILE_SERVER == "local":
        # generate preview and store it in local storage
        doc.generate_thumbnail()
    else:
        # generate preview using `s3_worker`
        # it will, as well, upload previews to s3 storage
        celery_app.send_task(
            const.S3_WORKER_GENERATE_PREVIEW,
            kwargs={"doc_id": str(doc.id)},
            route_name="s3preview",
        )

    return schemas.Document.model_validate(doc)
