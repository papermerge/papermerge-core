from argparse import Namespace
from typing import AbstractSet, Annotated

from fastapi import APIRouter, Security
from ocrmypdf.builtin_plugins.tesseract_ocr import TesseractOcrEngine

from papermerge.core import schemas, utils
from papermerge.core.auth import get_current_user, scopes

router = APIRouter(
    prefix="/ocr-languages",
    tags=["ocr-languages"],
)


@router.get("/")
@utils.docstring_parameter(scope=scopes.OCRLANG_VIEW)
def get_ocr_langs(
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.OCRLANG_VIEW])
    ],
) -> AbstractSet[str]:
    """Returns list of languages supported by OCR engine

    Required scope: `{scope}`

    Languages are given in 3-letter ISO 3166-1 codes
    """
    engine = TesseractOcrEngine()
    langs = engine.languages(Namespace())

    return langs
