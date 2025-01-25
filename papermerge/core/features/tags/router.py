import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Security

from papermerge.core.db.engine import Session
from papermerge.core import utils
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes

from papermerge.core.routers.params import CommonQueryParams

from papermerge.core.features.tags.db import api as tags_dbapi
from papermerge.core.features.tags import schema as tags_schema
from papermerge.core.exceptions import EntityNotFound
from .types import PaginatedQueryParams

router = APIRouter(
    prefix="/tags",
    tags=["tags"],
)

logger = logging.getLogger(__name__)


@router.get("/all", response_model=list[tags_schema.Tag])
@utils.docstring_parameter(scope=scopes.TAG_VIEW)
def retrieve_tags_without_pagination(
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_VIEW])
    ]
):
    """Retrieves (without pagination) tags of the current user

    Required scope: `{scope}`
    """
    with Session() as db_session:
        tags = tags_dbapi.get_tags_without_pagination(db_session, user_id=user.id)

    return tags


@router.get("/")
@utils.docstring_parameter(scope=scopes.TAG_VIEW)
def retrieve_tags(
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_VIEW])
    ],
    params: PaginatedQueryParams = Depends(),
):
    """Retrieves (paginated) tags of the current user

    Required scope: `{scope}`
    """
    with Session() as db_session:
        tags = tags_dbapi.get_tags(
            db_session,
            user_id=user.id,
            page_number=params.page_number,
            page_size=params.page_size,
            order_by=params.order_by,
            filter=params.filter,
        )

    return tags


@router.get("/{tag_id}", response_model=tags_schema.Tag)
@utils.docstring_parameter(scope=scopes.TAG_VIEW)
def get_tag_details(
    tag_id: UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_VIEW])
    ],
):
    """Get tag details

    Required scope: `{scope}`
    """
    try:
        with Session() as db_session:
            tag, error = tags_dbapi.get_tag(db_session, tag_id=tag_id, user_id=user.id)
    except EntityNotFound:
        raise HTTPException(status_code=404, detail="Does not exists")

    return tag


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.TAG_CREATE)
def create_tag(
    attrs: tags_schema.CreateTag,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_CREATE])
    ],
) -> tags_schema.Tag:
    """Creates user tag

    Required scope: `{scope}`
    """
    with Session() as db_session:
        tag, error = tags_dbapi.create_tag(db_session, attrs=attrs, user_id=user.id)

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return tag


@router.delete("/{tag_id}", status_code=204)
@utils.docstring_parameter(scope=scopes.TAG_DELETE)
def delete_tag(
    tag_id: UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_DELETE])
    ],
) -> None:
    """Deletes user tag

    Required scope: `{scope}`
    """
    try:
        with Session() as db_session:
            tags_dbapi.delete_tag(db_session, tag_id=tag_id, user_id=user.id)
    except EntityNotFound:
        raise HTTPException(status_code=404, detail="Does not exists")


@router.patch("/{tag_id}", status_code=200)
@utils.docstring_parameter(scope=scopes.TAG_UPDATE)
def update_tag(
    tag_id: UUID,
    attrs: tags_schema.UpdateTag,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_UPDATE])
    ],
) -> tags_schema.Tag:
    """Updates user tag

    Required scope: `{scope}`
    """
    with Session() as db_session:
        tag, error = tags_dbapi.update_tag(
            db_session, tag_id=tag_id, attrs=attrs, user_id=user.id
        )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return tag
