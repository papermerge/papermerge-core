from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ValidationError, validator

from papermerge.core.types import OCRStatusEnum


class NodeType(str, Enum):
    document = "document"
    folder = "folder"


class Tag(BaseModel):
    name: str
    bg_color: str = '#c41fff'
    fg_color: str = '#FFFFF'

    class Config:
        orm_mode = True
        schema_extra = {
            "example": [
                {
                    "name": "important",
                    "bg_color": "#ffaaff",
                    "fg_color": '#ff0000',
                }
            ]
        }


class UpdateNode(BaseModel):
    title: Optional[str]
    parent_id: Optional[UUID]

    @validator('parent_id')
    def parent_id_is_not_none(cls, value):
        if value is None:
            raise ValidationError('Cannot set parent_id to None')
        return value

    class Config:
        orm_mode = True


class DocumentNode(BaseModel):
    """Minimalist part of the document returned as part of nodes list"""
    ocr: bool = True  # will this document be OCRed?
    ocr_status: OCRStatusEnum = OCRStatusEnum.unknown
    thumbnail_url: str


class Node(BaseModel):
    id: UUID
    title: str
    ctype: NodeType
    tags: List[Tag]
    created_at: datetime
    updated_at: datetime
    parent_id: UUID | None
    user_id: UUID
    document: DocumentNode | None = None

    @validator('document', pre=True)
    def document_validator(cls, value, values):
        if values['ctype'] == NodeType.document:
            return DocumentNode(
                ocr_status=value.ocr_status,
                ocr=value.ocr,
                thumbnail_url=f"/api/thumbnails/{values['id']}"
            )

        return None

    @validator('tags', pre=True)
    def tags_validator(cls, value):
        if not isinstance(value, list):
            return list(value.all())

        return value

    class Config:
        orm_mode = True


class CreateNode(BaseModel):
    title: str
    ctype: NodeType.folder
    parent_id: UUID | None

    class Config:
        orm_mode = True


class MoveNode(BaseModel):
    source_ids: List[UUID]
    target_id: UUID
