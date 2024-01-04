from argparse import Namespace
from typing import AbstractSet

from fastapi import APIRouter, Depends
from ocrmypdf.builtin_plugins.tesseract_ocr import TesseractOcrEngine

from papermerge.core import schemas
from papermerge.core.auth import get_current_user

router = APIRouter(
    prefix="/ocr-languages",
    tags=["ocr-languages"],
)


@router.get("/")
def get_ocr_langs(
    user: schemas.User = Depends(get_current_user)
) -> AbstractSet[str]:
    """Returns list of languages supported by OCR engine

    Languages are given in 3-letter ISO 3166-1 codes
    """
    engine = TesseractOcrEngine()
    langs = engine.languages(Namespace())

    return langs
