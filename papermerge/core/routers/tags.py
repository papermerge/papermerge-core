import logging

from fastapi import APIRouter, Depends

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
