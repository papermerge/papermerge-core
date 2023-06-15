from enum import Enum

from pydantic import BaseModel


class State(str, Enum):
    unknown = 'UNKNOWN'
    pending = 'PENDING'
    received = 'RECEIVED'
    started = 'STARTED'
    success = 'SUCCESS'
    failed = 'FAILED'


class OCREvent(BaseModel):
    document_id: str
    user_id: str
    namespace: str | None
    lang: str


class Event(BaseModel):
    name: str
    kwargs: OCREvent
    state: State = State.unknown
