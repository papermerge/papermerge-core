from typing import List

from django.conf import settings
from fastapi import APIRouter, Depends
from salinic import Search, Session, create_engine

from papermerge.core.models import User
from papermerge.core.routers.auth import get_current_user as current_user
from papermerge.search.schema import IndexEntity

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

engine = create_engine(settings.SEARCH_URL)


@router.get("/")
def search(
    q: str,
    user: User = Depends(current_user)
) -> List[IndexEntity]:
    session = Session(engine)
    sq = Search(IndexEntity).query(q)

    results: List[IndexEntity] = session.exec(sq)

    # show results only of the documents belonging to the current user
    return [
        item for item in results if item.user_id == str(user.id)
    ]
