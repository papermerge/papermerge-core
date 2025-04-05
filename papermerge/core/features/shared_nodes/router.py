from fastapi import APIRouter, Security, Depends, Response, status

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
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
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


@router.post("/", status_code=204)
@utils.docstring_parameter(scope=scopes.SHARED_NODE_CREATE)
def create_shared_nodes(
    shared_node: schema.CreateSharedNode,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.SHARED_NODE_CREATE])
    ],
):
    """Creates shared node

    Required scope: `{scope}`
    """

    with Session() as db_session:
        dbapi.create_shared_nodes(
            db_session=db_session,
            node_ids=shared_node.node_ids,
            role_ids=shared_node.role_ids,
            user_ids=shared_node.user_ids,
            group_ids=shared_node.group_ids,
            owner_id=user.id,
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
