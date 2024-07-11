import logging
from typing import Annotated
from uuid import UUID

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Security

from papermerge.core import schemas, utils
from papermerge.core.auth import get_current_user, scopes
from papermerge.core.models import Tag

from .paginator import PaginatorGeneric, paginate
from .params import CommonQueryParams

router = APIRouter(
    prefix="/tags",
    tags=["tags"],
)

logger = logging.getLogger(__name__)


@router.get("/", response_model=PaginatorGeneric[schemas.Tag])
@paginate
@utils.docstring_parameter(scope=scopes.TAG_VIEW)
def retrieve_tags(
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TAG_VIEW])
    ],
    params: CommonQueryParams = Depends(),
):
    """Retrieves current user tags

    Required scope: `{scope}`
    """
    order_by = ['name', ]

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    return Tag.objects.filter(
        user_id=user.id
    ).order_by(*order_by)


@router.get("/{tag_id}", response_model=schemas.Tag)
@utils.docstring_parameter(scope=scopes.TAG_VIEW)
def get_tag_details(
    tag_id: UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TAG_VIEW])
    ]
):
    """Get tag details

    Required scope: `{scope}`
    """
    try:
        tag = Tag.objects.get(
            user_id=user.id,
            id=tag_id
        )
    except Tag.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )

    return schemas.Tag.model_validate(tag)


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.TAG_CREATE)
def create_tag(
    pytag: schemas.CreateTag,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TAG_CREATE])
    ],
) -> schemas.Tag:
    """Creates user tag

    Required scope: `{scope}`
    """

    try:
        tag = Tag.objects.create(user_id=user.id, **pytag.model_dump())
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Tag already exists"
        )

    return schemas.Tag.model_validate(tag)


@router.delete("/{tag_id}", status_code=204)
@utils.docstring_parameter(scope=scopes.TAG_DELETE)
def delete_tag(
    tag_id: UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TAG_DELETE])
    ],
) -> None:
    """Deletes user tag

    Required scope: `{scope}`
    """
    try:
        Tag.objects.get(user_id=user.id, id=tag_id).delete()
    except Tag.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )


@router.patch("/{tag_id}", status_code=200)
@utils.docstring_parameter(scope=scopes.TAG_UPDATE)
def update_tag(
    tag_id: UUID,
    tag: schemas.UpdateTag,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TAG_UPDATE])
    ],
) -> schemas.Tag:
    """Updates user tag

    Required scope: `{scope}`
    """

    qs = Tag.objects.filter(user_id=user.id, id=tag_id)

    if qs.count() != 1:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )

    qs.update(**tag.model_dump(exclude_unset=True))

    return schemas.Tag.model_validate(qs.first())
