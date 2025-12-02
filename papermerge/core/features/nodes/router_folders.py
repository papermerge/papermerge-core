import uuid
from typing import Annotated

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound
from fastapi import APIRouter, Security, HTTPException, Depends

from papermerge.core import utils
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.db import common as dbapi_common
from papermerge.core.exceptions import HTTP403Forbidden
from papermerge.core.db.engine import get_db
from .schema import Folder
from .db import api as dbapi

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("/{folder_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
async def get_node(
    folder_id: uuid.UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> Folder:
    """
    Get folder details

    Required scope: `{scope}`
    """
    ok = await dbapi_common.has_node_perm(
        db_session, node_id=folder_id, codename=scopes.NODE_VIEW, user_id=user.id
    )
    if not ok:
        raise HTTP403Forbidden()

    try:
        folder = await dbapi.get_folder(db_session, folder_id=folder_id, user_id=user.id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Resource not found")


    return folder
