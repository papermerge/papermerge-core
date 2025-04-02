import uuid
from fastapi import APIRouter, Security, Depends

from typing import Annotated

from papermerge.core import utils, schema, dbapi
from papermerge.core.routers.params import CommonQueryParams
from papermerge.core.features.auth import scopes, get_current_user
from papermerge.core.db.engine import Session

router = APIRouter(
    prefix="/shared-nodes",
    tags=["shared-nodes"],
)


@router.get("/")
@utils.docstring_parameter(scope=scopes.SHARED_NODE_VIEW)
def get_shared_nodes(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    params: CommonQueryParams = Depends(),
):
    """Returns a list of top level nodes shared with current user

    Required scope: `{scope}`
    """
    order_by = ["ctype", "title", "created_at", "updated_at"]

    if params.order_by:
        order_by = [item.strip() for item in params.order_by.split(",")]

    with Session() as db_session:
        nodes = dbapi.get_paginated_shared_nodes(
            db_session=db_session,
            page_size=params.page_size,
            page_number=params.page_number,
            order_by=order_by,
            filter=params.filter,
            user_id=user.id,
        )

    return nodes
