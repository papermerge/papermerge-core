import logging
from typing import Annotated
from uuid import UUID

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Security

from papermerge.core import schemas
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
def retrieve_tags(
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TAG_VIEW])
    ],
    params: CommonQueryParams = Depends(),
):
    """Retrieves current user tags"""
    order_by = ['name', ]

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    return Tag.objects.filter(
        user_id=user.id
    ).order_by(*order_by)


@router.post("/", status_code=201)
def create_tag(
    pytag: schemas.CreateTag,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TAG_CREATE])
    ],
) -> schemas.Tag:
    """Creates user tag"""
    try:
        tag = Tag.objects.create(user_id=user.id, **pytag.model_dump())
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Tag already exists"
        )

    return schemas.Tag.model_validate(tag)


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TAG_DELETE])
    ],
) -> None:
    """Deletes user tag"""
    try:
        Tag.objects.get(user_id=user.id, id=tag_id).delete()
    except Tag.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )


@router.patch("/{tag_id}", status_code=200)
def update_tag(
    tag_id: UUID,
    tag: schemas.UpdateTag,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.TAG_UPDATE])
    ],
) -> schemas.Tag:
    """Updates user tag"""

    qs = Tag.objects.filter(user_id=user.id, id=tag_id)

    if qs.count() != 1:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )

    qs.update(**tag.model_dump(exclude_unset=True))

    return schemas.Tag.model_validate(qs.first())
