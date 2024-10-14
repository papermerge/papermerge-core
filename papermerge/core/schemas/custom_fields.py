from datetime import date
from enum import Enum
from typing import TypeAlias
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CustomFieldType(str, Enum):
    string = "string"
    url = "url"
    date = "date"
    boolean = "boolean"
    int = "int"
    float = "float"
    monetary = "monetary"


class CustomField(BaseModel):
    id: UUID
    name: str
    data_type: CustomFieldType
    extra_data: str | None

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateCustomField(BaseModel):
    name: str
    data_type: CustomFieldType
    extra_data: str | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateCustomField(BaseModel):
    name: str | None = None
    data_type: CustomFieldType | None = None
    extra_data: str | None = None


class CustomFieldValue(CustomField):
    # notice that attribue `id` indicates the ID of
    # custom field value
    value: str | None = None
    # the ID of the custom field
    field_id: UUID


CFValueType: TypeAlias = str | int | date | bool | float | None
CFNameType: TypeAlias = str


class CFV(BaseModel):
    # custom field value
    # `core_documents.id`
    document_id: UUID
    # `core_documents.document_type_id`
    document_type_id: UUID
    # `custom_fields.id`
    custom_field_id: UUID
    # `custom_fields.name`
    name: CFNameType
    # `custom_fields.type`
    type: CustomFieldType
    # `custom_fields.extra_data`
    extra_data: str | None
    # `custom_field_values.id`
    custom_field_value_id: UUID | None = None
    # `custom_field_values.value_text` or `custom_field_values.value_int` or ...
    value: CFValueType = None


class DocumentCFV(BaseModel):
    id: UUID
    title: str
    # created_at: datetime
    # updated_at: datetime
    # parent_id: UUID | None
    # user_id: UUID
    document_type_id: UUID | None = None
    thumbnail_url: str | None = None
    custom_fields: list[tuple[CFNameType, CFValueType]]
