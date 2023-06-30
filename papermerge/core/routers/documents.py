import io
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse

from papermerge.core.models import Document, User
from papermerge.core.schemas.documents import Document as PyDocument
from papermerge.core.schemas.documents import Thumbnail
from papermerge.core.storage import abs_path

from .auth import get_current_user as current_user

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


class JPEGFileResponse(FileResponse):
    media_type = 'application/jpeg'


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


@router.get("/{document_id}/thumbnail")
def generate_document_thumbnail(
    document_id: uuid.UUID,
    size: int = 100,
    user: User = Depends(current_user)
) -> Thumbnail:
    """Generates thumbnail of the document last version's first page

    Thumbnail is size px wide.
    """
    try:
        doc = Document.objects.get(id=document_id, user=user)
    except Document.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Page does not exist"
        )

    jpeg_abs_path = abs_path(doc.thumbnail_path(size=size))

    if not os.path.exists(jpeg_abs_path):
        # generate preview/thumbnail
        # of the doc last version's first page
        doc.generate_thumbnail(size=size)

    if not os.path.exists(jpeg_abs_path):
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return Thumbnail(
        size=size,
        url=f"/{document_id}/thumbnail/jpg"
    )


@router.get(
    "/{document_id}/thumbnail/jpg",
    response_class=JPEGFileResponse
)
def retrieve_document_thumbnail(
    document_id: uuid.UUID,
    size: int = 100,
    user: User = Depends(current_user)
):
    """Retrieves thumbnail of the document last version's first page

    Thumbnail is size px wide.
    """
    try:
        doc = Document.objects.get(id=document_id, user=user)
    except Document.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Page does not exist"
        )

    jpeg_abs_path = abs_path(doc.thumbnail_path(size=size))

    if not os.path.exists(jpeg_abs_path):
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return JPEGFileResponse(jpeg_abs_path)
