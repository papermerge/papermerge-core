from uuid import UUID

from pydantic import BaseModel, ConfigDict

from papermerge.core.features.custom_fields.schema import CustomField


class DocumentType(BaseModel):
    id: UUID
    name: str
    path_template: str | None = None
    custom_fields: list[CustomField]

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateDocumentType(BaseModel):
    name: str
    path_template: str | None = None
    custom_field_ids: list[UUID]

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateDocumentType(BaseModel):
    name: str | None = None
    path_template: str | None = None
    custom_field_ids: list[UUID] | None = None
