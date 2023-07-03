import logging

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException

from papermerge.core import schemas
from papermerge.core.models import Tag, User

from .auth import get_current_user as current_user
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
    params: CommonQueryParams = Depends(),
    user: User = Depends(current_user)
):
    """Retrieves current user tags"""
    order_by = ['name', ]

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    return Tag.objects.filter(
        user=user
    ).order_by(*order_by)


@router.post("/", status_code=201)
def create_tag(
    pytag: schemas.CreateTag,
    user: User = Depends(current_user),
) -> schemas.Tag:
    """Creates user tag"""
    try:
        tag = Tag.objects.create(user=user, **pytag.dict())
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Tag already exists"
        )

    return schemas.Tag.from_orm(tag)
