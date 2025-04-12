import uuid
from typing import Annotated


from fastapi import APIRouter, Security, HTTPException

from papermerge.core.db.engine import Session
from papermerge.core import utils
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.db import common as dbapi_common
from papermerge.core.exceptions import HTTP403Forbidden
from papermerge.core import schema

from .db import api as dbapi

router = APIRouter(prefix="/shared-folders", tags=["shared-folders"])


@router.get("/{folder_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_shared_folder_details(
    folder_id: uuid.UUID,
    shared_root_id: uuid.UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
) -> schema.Folder:
    """
    Get shared folder details

    Required scope: `{scope}`
    """
    with Session() as db_session:
        ok = dbapi_common.has_node_perm(
            db_session, node_id=folder_id, codename=scopes.NODE_VIEW, user_id=user.id
        )
        if not ok:
            raise HTTP403Forbidden

        db_folder, error = dbapi.get_shared_folder(
            db_session, folder_id=folder_id, shared_root_id=shared_root_id
        )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return schema.Folder.model_validate(db_folder)
