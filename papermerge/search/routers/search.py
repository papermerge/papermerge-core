from typing import List

from django.conf import settings
from fastapi import APIRouter, Depends
from salinic import IndexRO, Search, create_engine

from papermerge.core import schemas
from papermerge.core.auth import get_current_user
from papermerge.search.schema import Model

router = APIRouter(
    prefix="/search",
    tags=["search"]
)


@router.get("/")
def search(
    q: str,
    user: schemas.User = Depends(get_current_user)
) -> List[Model]:
    engine = create_engine(settings.SEARCH_URL)
    index = IndexRO(engine, schema=Model)

    sq = Search(Model).query(q)

    results: List[Model] = index.search(sq)

    # show results only of the documents belonging to the current user
    return [
        item for item in results if item.user_id == str(user.id)
    ]
