from enum import Enum

from pydantic import BaseModel


class State(str, Enum):
    unknown = 'UNKNOWN'
    pending = 'PENDING'
    received = 'RECEIVED'
    started = 'STARTED'
    success = 'SUCCESS'
    failed = 'FAILURE'


class EventName(str, Enum):
    ocr_document = 'ocr_document_task'
    refresh_inbox = 'refresh_inbox'


class OCREvent(BaseModel):
    document_id: str
    user_id: str
    lang: str


class Event(BaseModel):
    name: EventName
    kwargs: OCREvent
    state: State = State.unknown
