from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DocumentType(BaseModel):
    id: UUID
    name: str
    custom_field_ids: list[str]

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateDocumentType(BaseModel):
    name: str
    custom_field_ids: list[str]

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateDocumentType(BaseModel):
    name: str | None = None
    custom_field_ids: list[str] | None = None
