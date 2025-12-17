import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from papermerge.core import schema
from papermerge.core.features import auth
from papermerge.core.features.auth import scopes

router = APIRouter(
    prefix="/scopes",
    tags=["scopes"],
)

logger = logging.getLogger(__name__)


@router.get("/", response_model=list[str])
async def get_all_scopes(
    user: Annotated[schema.User, Depends(auth.get_current_user)],
):
    """Returns all existing scopes"""
    return scopes.SCOPES
