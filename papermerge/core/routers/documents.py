import uuid
from fastapi import APIRouter, Depends

from papermerge.core.models import User

from papermerge.core.schemas.documents import Document as PyDocument
from papermerge.core.models import Document

from .auth import oauth2_scheme
from .auth import get_current_user as current_user

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    dependencies=[Depends(oauth2_scheme)]
)


@router.get("/{id}")
def get_document(
    id: uuid.UUID,
    user: User = Depends(current_user)
) -> PyDocument:
    doc = Document.objects.get(id=id, user_id=user.id)
    return PyDocument.from_orm(doc)
