from uuid import UUID

from pydantic import BaseModel, ConfigDict

from papermerge.core.features.custom_fields.schema import CustomField


class DocumentType(BaseModel):
    id: UUID
    name: str
    path_template: str | None = None
    custom_fields: list[CustomField]
    group_id: UUID | None = None
    group_name: str | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateDocumentType(BaseModel):
    name: str
    path_template: str | None = None
    custom_field_ids: list[UUID]
    group_id: UUID | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateDocumentType(BaseModel):
    name: str | None = None
    path_template: str | None = None
    custom_field_ids: list[UUID] | None = None
    group_id: UUID | None = None
    user_id: UUID | None = None
