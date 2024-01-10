import io
import uuid

from fastapi import APIRouter, Depends, UploadFile

from papermerge.core import db, schemas
from papermerge.core.auth import get_current_user
from papermerge.core.models import Document

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


@router.get("/{document_id}")
def get_document_details(
    document_id: uuid.UUID,
    user: schemas.User = Depends(get_current_user),
    engine: db.Engine = Depends(db.get_engine)
) -> schemas.Document:

    doc = db.get_doc(engine, id=document_id, user_id=user.id)

    return doc


@router.post("/{document_id}/upload")
def upload_file(
    document_id: uuid.UUID,
    file: UploadFile,
    user: schemas.User = Depends(get_current_user)
) -> schemas.Document:
    """
    Uploads file for given document.

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
