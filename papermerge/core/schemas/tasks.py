from typing import Literal
from uuid import UUID

from pydantic import BaseModel

LangCode = Literal[
    'ces',
    'dan',
    'deu',
    'ell',
    'eng',
    'fas',
    'fin',
    'fra',
    'guj',
    'heb',
    'hin',
    'ita',
    'jpn',
    'kor',
    'lit',
    'nld',
    'nor',
    'pol',
    'por',
    'ron',
    'san',
    'spa'
]


class OCRTaskIn(BaseModel):
    id: UUID  # document model ID
    lang: LangCode


class OCRTaskOut(BaseModel):
    task_id: UUID
