from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class LangCodeEnum(str, Enum):
    deu = "deu"
    fra = "fra"
    eng = "eng"
    ita = "ita"
    spa = "spa"


class OCRTaskIn(BaseModel):
    id: UUID  # document model ID
    lang: LangCodeEnum


class OCRTaskOut(BaseModel):
    task_id: UUID
