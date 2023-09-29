from fastapi import APIRouter, Depends

from papermerge.core.models import Folder, User
from papermerge.core.schemas.folders import Folder as PyFolder

from .auth import get_current_user as current_user

router = APIRouter(
    prefix="/folders",
    tags=["folders"]
)


@router.get("/{folder_id}")
def get_node(
    folder_id,
    user: User = Depends(current_user)
) -> PyFolder:

    folder = Folder.objects.get(id=folder_id, user_id=user.id)
    return PyFolder.model_validate(folder)
