import uuid
from fastapi import APIRouter, Depends

from papermerge.core.models import User

from .auth import oauth2_scheme
from .auth import get_current_user as current_user

router = APIRouter(
    prefix="/pages",
    tags=["pages"],
    dependencies=[Depends(oauth2_scheme)]
)


@router.get("/{page_id}/svg")
def get_page_svg_url(
    page_id: uuid.UUID,
    user: User = Depends(current_user)
):
    pass


@router.get("/{page_id}/jpg")
def get_page_jpg_url(
    page_id: uuid.UUID,
    user: User = Depends(current_user)
):
    pass
