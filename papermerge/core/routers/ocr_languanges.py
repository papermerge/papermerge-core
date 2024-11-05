from argparse import Namespace
from typing import AbstractSet, Annotated

from fastapi import APIRouter, Security

from papermerge.core import schemas, utils
from papermerge.core.features.auth import get_current_user
from core.features.auth import scopes

router = APIRouter(
    prefix="/ocr-languages",
    tags=["ocr-languages"],
)


@router.get("/")
@utils.docstring_parameter(scope=scopes.OCRLANG_VIEW)
def get_ocr_langs(
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.OCRLANG_VIEW])
    ],
) -> AbstractSet[str]:
    """Returns list of languages supported by OCR engine

    Required scope: `{scope}`

    Languages are given in 3-letter ISO 3166-1 codes
    """

    return {"deu", "eng", "fra"}
