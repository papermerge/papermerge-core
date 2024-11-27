from collections.abc import Sequence
from datetime import date
from enum import Enum
from typing import Generic, Literal, TypeAlias, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")
DocumentVersion = TypeVar("DocumentVersion")


CType = Literal["document", "folder"]


class OCRStatusEnum(str, Enum):
    unknown = "UNKNOWN"
    received = "RECEIVED"
    started = "STARTED"
    success = "SUCCESS"
    failure = "FAILURE"


class PaginatedResponse(BaseModel, Generic[T]):
    page_size: int
    page_number: int
    num_pages: int
    items: Sequence[T]

    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    user_id: str
    username: str
    email: str
    scopes: list[str] = []
    groups: list[str] = []


CFValueType: TypeAlias = str | int | date | bool | float | None
CFNameType: TypeAlias = str


class OrderEnum(str, Enum):
    asc = "asc"
    desc = "desc"

class CFVValueColumn(str, Enum):
    TEXT = 'value_text'
    DATE = 'value_date'
    MONETARY = 'value_monetary'
    BOOLEAN = 'value_boolean'
    YEARMONTH = 'value_yearmonth'
