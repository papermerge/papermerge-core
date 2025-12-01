import logging
import uuid
from typing import Annotated, Union

from fastapi import APIRouter, Security, Depends, Response, status, \
    HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.db.engine import get_db
from papermerge.core import utils, schema, dbapi
from papermerge.core.features.auth import scopes, get_current_user
from papermerge.core.types import PaginatedResponse
from papermerge.core.features.shared_nodes.schema import SharedNodeParams
from papermerge.core.auth import require_scopes

router = APIRouter(
    prefix="/shared-nodes",
    tags=["shared-nodes"],
)


logger = logging.getLogger(__name__)


@router.get("", response_model=PaginatedResponse[Union[schema.DocumentEx, schema.FolderEx]],
)
async def get_shared_nodes(
    user: require_scopes(scopes.NODE_VIEW),
    params: SharedNodeParams = Depends(),
    db_session: AsyncSession = Depends(get_db),
) -> PaginatedResponse[Union[schema.DocumentEx, schema.FolderEx]]:
    """Returns a list of top level nodes shared with current user"""
    try:
        filters = params.to_filters()
        result = await dbapi.get_paginated_shared_nodes(
            db_session=db_session,
            user_id=user.id,
            page_size=params.page_size,
            page_number=params.page_number,
            sort_by=params.sort_by,
            sort_direction=params.sort_direction,
            filters=filters,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        logger.error(
            f"Error fetching shared nodes for user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

    return result


@router.post("", status_code=204)
@utils.docstring_parameter(scope=scopes.SHARED_NODE_CREATE)
async def create_shared_nodes(
    shared_node: schema.CreateSharedNode,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.SHARED_NODE_CREATE])
    ],
    db_session: AsyncSession=Depends(get_db),
):
    """Creates shared node

    Required scope: `{scope}`
    """

    await dbapi.create_shared_nodes(
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
async def get_shared_node_access_details(
    node_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.SHARED_NODE_VIEW])
    ],
    db_session: AsyncSession=Depends(get_db),
) -> schema.SharedNodeAccessDetails:
    """Get shared node access details

    Required scope: `{scope}`

    In other words: gets info about who can access this node
    and with what roles?
    """
    node_access = await dbapi.get_shared_node_access_details(db_session, node_id=node_id)

    return node_access


@router.patch("/access/{node_id}", status_code=status.HTTP_200_OK)
@utils.docstring_parameter(scope=scopes.SHARED_NODE_UPDATE)
async def update_shared_node_access(
    node_id: uuid.UUID,
    access_update: schema.SharedNodeAccessUpdate,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.SHARED_NODE_VIEW])
    ],
    db_session: AsyncSession=Depends(get_db),
):
    """Update shared nodes access

    Required scope: `{scope}`

    More appropriate name for this would be "sync" - because this is
    exactly what it does - it actually syncs content in `access_update` for
    specific node_id to match data in `shared_nodes` table.
    """
    await dbapi.update_shared_node_access(
        db_session, node_id=node_id, access_update=access_update, owner_id=user.id
    )
