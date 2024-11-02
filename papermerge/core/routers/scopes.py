import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from papermerge.core import schemas
from core import auth
from core.features.auth import scopes

router = APIRouter(
    prefix="/scopes",
    tags=["scopes"],
)

logger = logging.getLogger(__name__)


@router.get("/", response_model=schemas.Scopes)
async def get_all_scopes(
    user: Annotated[schemas.User, Depends(auth.get_current_user)],
):
    """Returns all existing scopes"""
    return scopes.SCOPES
