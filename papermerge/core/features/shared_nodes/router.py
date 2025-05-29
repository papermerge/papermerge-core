import uuid
from fastapi import APIRouter, Security, Depends, Response, status, HTTPException

from typing import Annotated, Union

from papermerge.core import utils, schema, dbapi
from papermerge.core.routers.params import CommonQueryParams
from papermerge.core.features.auth import scopes, get_current_user
from papermerge.core.db.engine import Session
from papermerge.core.types import PaginatedResponse
from papermerge.core.features.nodes.db import api as nodes_api


router = APIRouter(
    prefix="/shared-nodes",
    tags=["shared-nodes"],
)


@router.get("/")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_shared_nodes(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    params: CommonQueryParams = Depends(),
) -> PaginatedResponse[Union[schema.Document, schema.Folder]]:
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


@router.get("/folder/{parent_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_node(
    parent_id,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    params: CommonQueryParams = Depends(),
) -> PaginatedResponse[Union[schema.Document, schema.Folder]]:
    """Returns a list of top level nodes shared with current user

    Required scope: `{scope}`
    """
    order_by = ["ctype", "title", "created_at", "updated_at"]

    if params.order_by:
        order_by = [item.strip() for item in params.order_by.split(",")]

    with Session() as db_session:
        nodes = nodes_api.get_paginated_nodes(
            db_session=db_session,
            parent_id=uuid.UUID(parent_id),
            user_id=user.id,
            page_size=params.page_size,
            page_number=params.page_number,
            order_by=order_by,
            filter=params.filter,
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


@router.get("/access/{node_id}")
@utils.docstring_parameter(scope=scopes.SHARED_NODE_VIEW)
def get_shared_node_access_details(
    node_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.SHARED_NODE_VIEW])
    ],
) -> schema.SharedNodeAccessDetails:
    """Get shared node access details

    Required scope: `{scope}`

    In other words: gets info about who can access this node
    and with what roles?
    """
    with Session() as db_session:
        node_access = dbapi.get_shared_node_access_details(db_session, node_id=node_id)

    return node_access


@router.patch("/access/{node_id}", status_code=status.HTTP_200_OK)
@utils.docstring_parameter(scope=scopes.SHARED_NODE_UPDATE)
def update_shared_node_access(
    node_id: uuid.UUID,
    access_update: schema.SharedNodeAccessUpdate,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.SHARED_NODE_VIEW])
    ],
):
    """Update shared nodes access

    Required scope: `{scope}`

    More appropriate name for this would be "sync" - because this is
    exactly what it does - it actually syncs content in `access_update` for
    specific node_id to match data in `shared_nodes` table.
    """
    with Session() as db_session:
        dbapi.update_shared_node_access(
            db_session, node_id=node_id, access_update=access_update, owner_id=user.id
        )
