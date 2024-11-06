from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Security, HTTPException

from papermerge.core.db.engine import Session
from papermerge.core import utils
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes

from .schema import Folder
from .db import api as dbapi

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("/{folder_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_node(
    folder_id,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
) -> Folder:
    """
    Get folder details

    Required scope: `{scope}`
    """
    with Session() as db_session:
        db_folder, error = dbapi.get_folder(
            db_session, folder_id=UUID(folder_id), user_id=user.id
        )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return Folder.model_validate(db_folder)
