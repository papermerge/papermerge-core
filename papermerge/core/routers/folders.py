from fastapi import APIRouter, Depends

from papermerge.core import schemas
from papermerge.core.auth import get_current_user
from papermerge.core.models import Folder

router = APIRouter(
    prefix="/folders",
    tags=["folders"]
)


@router.get("/{folder_id}")
def get_node(
    folder_id,
    user: schemas.User = Depends(get_current_user)
) -> schemas.Folder:

    folder = Folder.objects.get(id=folder_id, user_id=user.id)
    return schemas.Folder.model_validate(folder)
