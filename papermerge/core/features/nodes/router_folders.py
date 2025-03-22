import uuid
from typing import Annotated


from fastapi import APIRouter, Depends, Security, HTTPException

from papermerge.core.db.engine import Session
from papermerge.core import utils
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.db import common as dbapi_common

from .schema import Folder
from .db import api as dbapi

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("/{folder_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_node(
    folder_id: uuid.UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
) -> Folder:
    """
    Get folder details

    Required scope: `{scope}`
    """
    with Session() as db_session:
        ok = dbapi_common.has_node_perm(db_session, node_id=folder_id, user_id=user.id)
        if not ok:
            raise HTTPException(status_code=403, detail="Access forbidden")
        db_folder, error = dbapi.get_folder(db_session, folder_id=folder_id)

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return Folder.model_validate(db_folder)
