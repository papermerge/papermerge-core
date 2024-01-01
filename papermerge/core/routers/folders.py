from fastapi import APIRouter, Depends

from papermerge.core import db
from papermerge.core.models import User
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

    folder = db.get_folder_by_id(
        folder_id=str(folder_id),
        user_id=str(user.id)
    )

    return PyFolder.model_validate(folder)
