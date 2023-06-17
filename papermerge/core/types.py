from enum import Enum
from typing import TypeVar

DocumentVersion = TypeVar("DocumentVersion")


class OCRStatusEnum(str, Enum):
    unknown = 'unknown'
    received = 'received'
    started = 'started'
    succeeded = 'succeeded'
    failed = 'failed'
