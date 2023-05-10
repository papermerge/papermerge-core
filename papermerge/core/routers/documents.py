import io
import uuid
from fastapi import APIRouter, Depends, UploadFile

from papermerge.core.models import User

from papermerge.core.schemas.documents import Document as PyDocument
from papermerge.core.models import Document

from .auth import get_current_user as current_user

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


@router.get("/{document_id}")
def get_document_details(
    document_id: uuid.UUID,
    user: User = Depends(current_user)
) -> PyDocument:
    doc = Document.objects.get(id=document_id, user_id=user.id)
    return PyDocument.from_orm(doc)


@router.post("/{document_id}/upload")
def upload_file(
    document_id: uuid.UUID,
    file: UploadFile,
    user: User = Depends(current_user)
) -> PyDocument:
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
        file_name=file.filename
    )
    return PyDocument.from_orm(doc)
