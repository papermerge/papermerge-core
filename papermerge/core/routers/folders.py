from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Security

from papermerge.core import db, schemas, utils
from papermerge.core.auth import get_current_user, scopes

router = APIRouter(
    prefix="/folders",
    tags=["folders"]
)


@router.get("/{folder_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_node(
    folder_id,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    engine: db.Engine = Depends(db.get_engine)
) -> schemas.Folder:
    """
    Get folder details

    Required scope: `{scope}`
    """
    folder = db.get_folder(
        engine,
        folder_id=UUID(folder_id),
        user_id=user.id
    )

    return folder
