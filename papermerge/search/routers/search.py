from typing import List

from django.conf import settings
from fastapi import APIRouter
from salinic import Search, Session, create_engine

from papermerge.search.schema import IndexEntity

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

engine = create_engine(settings.SEARCH_URL)


@router.get("/")
def search(q: str) -> List[IndexEntity]:
    session = Session(engine)
    sq = Search(IndexEntity).query(q)

    results: List[IndexEntity] = session.exec(sq)

    return results
