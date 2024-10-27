from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_core.core_schema import ValidationInfo

from papermerge.core import types


class CustomFieldType(str, Enum):
    text = "text"
    date = "date"
    boolean = "boolean"
    int = "int"
    float = "float"
    monetary = "monetary"


class CustomField(BaseModel):
    id: UUID
    name: str
    type: CustomFieldType
    # for sqlite database JSON field is stored as string
    # for pg database JSON field is stored as JSON data
    # and when fetched - is presented as python dictionary
    # Basically `extra_data` is either a stringified JSON i.e. json.dumps(...)
    # or an actually python dict (or None)
    extra_data: str | dict | None

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateCustomField(BaseModel):
    name: str
    type: CustomFieldType
    extra_data: str | None = None

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateCustomField(BaseModel):
    name: str | None = None
    type: CustomFieldType | None = None
    extra_data: str | None = None


class CustomFieldValue(CustomField):
    # notice that attribue `id` indicates the ID of
    # custom field value
    value: str | None = None
    # the ID of the custom field
    field_id: UUID


class CFV(BaseModel):
    # custom field value
    # `core_documents.id`
    document_id: UUID
    # `core_documents.document_type_id`
    document_type_id: UUID
    # `custom_fields.id`
    custom_field_id: UUID
    # `custom_fields.name`
    name: types.CFNameType
    # `custom_fields.type`
    type: CustomFieldType
    # `custom_fields.extra_data`
    extra_data: str | dict | None
    # `custom_field_values.id`
    custom_field_value_id: UUID | None = None
    # `custom_field_values.value_text` or `custom_field_values.value_int` or ...
    value: types.CFValueType = None

    @field_validator("value", mode="before")
    @classmethod
    def convert_value(cld, value, info: ValidationInfo) -> types.CFValueType:
        if value and info.data["type"] == CustomFieldType.monetary:
            return float(value)

        return value


class DocumentCFV(BaseModel):
    id: UUID
    title: str
    # created_at: datetime
    # updated_at: datetime
    # parent_id: UUID | None
    # user_id: UUID
    document_type_id: UUID | None = None
    thumbnail_url: str | None = None
    custom_fields: list[tuple[types.CFNameType, types.CFValueType]]
