from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.auth.dependencies import require_scopes
from papermerge.core.features.auth import scopes
from papermerge.core.db.engine import get_db

from .schema import SearchQueryParams


router = APIRouter(
    prefix="/search",
    tags=["search"]
)


@router.post("/")
async def documents_search(
    user: require_scopes(scopes.NODE_VIEW),
    params: SearchQueryParams,
    db_session: AsyncSession = Depends(get_db)
):
    """Advanced document search and filtering"""
    ...
