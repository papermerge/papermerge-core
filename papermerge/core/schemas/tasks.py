from typing import Literal
from uuid import UUID

from pydantic import BaseModel

LangCode = Literal[
    'ces',
    'dan',
    'deu',
    'ell',
    'eng',
    'fin',
    'fra',
    'heb',
    'ita',
    'jpn',
    'kor',
    'lit',
    'nld',
    'nor',
    'osd',
    'pol',
    'por',
    'ron',
    'spa'
]


class OCRTaskIn(BaseModel):
    id: UUID  # document model ID
    lang: LangCode


class OCRTaskOut(BaseModel):
    task_id: UUID
