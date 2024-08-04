
from django.conf import settings
from fastapi import APIRouter, Depends
from salinic import IndexRO, Search, create_engine

from papermerge.core import schemas
from papermerge.core.auth import get_current_user
from papermerge.search.schema import DocumentPage, Folder, SearchIndex

router = APIRouter(
    prefix="/search",
    tags=["search"]
)


@router.get("/")
def search(
    q: str,
    start: int = 0,
    rows: int = 100,
    user: schemas.User = Depends(get_current_user)
) -> list[DocumentPage | Folder]:
    engine = create_engine(settings.SEARCH_URL)
    index = IndexRO(engine, schema=SearchIndex)

    sq = Search(SearchIndex).query(
        q,
        start=start,
        rows=rows
    )
    results: list[DocumentPage | Folder] = index.search(sq, user_id=str(user.id))

    return results
