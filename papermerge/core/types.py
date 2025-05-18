from collections.abc import Sequence
from datetime import date
from enum import Enum
from typing import Generic, Literal, TypeAlias, TypeVar
from fastapi import Query

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
    roles: list[str] = []


CFValueType: TypeAlias = str | int | date | bool | float | None
CFNameType: TypeAlias = str


class OrderEnum(str, Enum):
    asc = "asc"
    desc = "desc"

class CFVValueColumn(str, Enum):
    TEXT = 'value_text'
    INT = 'value_int'
    FLOAT = 'value_float'
    DATE = 'value_date'
    MONETARY = 'value_monetary'
    BOOLEAN = 'value_boolean'
    YEARMONTH = 'value_yearmonth'


class PaginatedQueryParams(BaseModel):
    page_size: int = Query(5, ge=1, description="Number of items per page")
    page_number: int = Query(
        1, ge=1, description="Page number. It is first, second etc. page?"
    )
    filter: str | None = None


class ImagePreviewStatus(str, Enum):
    """Image preview status

    1. If database field `preview_status` is NULL ->
        image preview was not considered yet i.e. client
        have not asked for it yet.
    2. "pending" - image preview was scheduled, as client has asked
        for it, but has not started yet
    3. "ready - image preview complete:
        a. preview image was generated
        b. preview image was uploaded to S3
    4. "failed" image preview failed
    """
    ready = "ready"
    pending = "pending"
    failed = "failed"


class ImagePreviewSize(str, Enum):
    sm = "sm"  # small
    md = "md"  # medium
    lg = "lg"  # large
    xl = "xl"  # extra large
