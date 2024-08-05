
from django.conf import settings
from fastapi import APIRouter, Depends
from salinic import IndexRO, Search, create_engine

from papermerge.core import schemas
from papermerge.core.auth import get_current_user
from papermerge.search.schema import (
    DocumentPage,
    Folder,
    SearchIndex,
    PaginatedResponse
)

router = APIRouter(
    prefix="/search",
    tags=["search"]
)


@router.get("/", response_model=PaginatedResponse)
def search(
    q: str,
    page_number: int = 1,
    page_size: int = 10,
    user: schemas.User = Depends(get_current_user)
):
    engine = create_engine(settings.SEARCH_URL)
    index = IndexRO(engine, schema=SearchIndex)

    sq = Search(SearchIndex).query(
        q,
        page_number=page_number,
        page_size=page_size
    )
    results = index.search(sq, user_id=str(user.id))

    return results
