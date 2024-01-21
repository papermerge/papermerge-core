from uuid import UUID

from fastapi import APIRouter, Depends

from papermerge.core import db, schemas
from papermerge.core.auth import get_current_user

router = APIRouter(
    prefix="/folders",
    tags=["folders"]
)


@router.get("/{folder_id}")
def get_node(
    folder_id,
    user: schemas.User = Depends(get_current_user),
    engine: db.Engine = Depends(db.get_engine)
) -> schemas.Folder:

    folder = db.get_folder(
        engine,
        folder_id=UUID(folder_id),
        user_id=user.id
    )

    return folder
