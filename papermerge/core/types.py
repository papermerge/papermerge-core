from enum import Enum
from typing import TypeVar

DocumentVersion = TypeVar("DocumentVersion")


class OCRStatusEnum(str, Enum):
    unknown = 'UNKNOWN'
    received = 'RECEIVED'
    started = 'STARTED'
    success = 'SUCCESS'
    failed = 'FAILED'
