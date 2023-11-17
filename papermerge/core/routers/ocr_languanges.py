from argparse import Namespace
from typing import AbstractSet

from fastapi import APIRouter, Depends
from ocrmypdf.builtin_plugins.tesseract_ocr import TesseractOcrEngine

from papermerge.core.models import User
from papermerge.core.routers.auth import get_current_user as current_user

router = APIRouter(
    prefix="/ocr-languages",
    tags=["ocr-languages"],
)


@router.get("/")
def get_ocr_langs(user: User = Depends(current_user)) -> AbstractSet[str]:
    """Returns list of languages supported by OCR engine

    Languages are given in 3-letter ISO 3166-1 codes
    """
    engine = TesseractOcrEngine()
    langs = engine.languages(Namespace())

    return langs
