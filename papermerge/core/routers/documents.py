import io
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Security, UploadFile

from papermerge.core import db, schemas, utils
from papermerge.core.auth import get_current_user, scopes
from papermerge.core.models import Document

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


@router.get("/{document_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_document_details(
    document_id: uuid.UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    engine: db.Engine = Depends(db.get_engine)
) -> schemas.Document:
    """
    Get document details

    Required scope: `{scope}`
    """
    doc = db.get_doc(engine, id=document_id, user_id=user.id)

    return doc


@router.post("/{document_id}/upload")
@utils.docstring_parameter(scope=scopes.DOCUMENT_UPLOAD)
def upload_file(
    document_id: uuid.UUID,
    file: UploadFile,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.DOCUMENT_UPLOAD])
    ]
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
    doc = Document.objects.get(
        id=document_id,
        user_id=user.id
    )
    content = file.file.read()
    doc.upload(
        size=file.size,
        content=io.BytesIO(content),
        file_name=file.filename,
        content_type=file.headers.get('content-type')
    )
    doc.generate_thumbnail()

    return schemas.Document.model_validate(doc)
