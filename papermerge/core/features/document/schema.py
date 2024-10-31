from typing import TypeAlias
from uuid import UUID

from pydantic import BaseModel, ValidationInfo, field_validator

from papermerge.core.features.custom_fields.schema import CustomFieldType
from papermerge.core.types import CFNameType, CFValueType


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
    extra_data: str | dict | None
    # `custom_field_values.id`
    custom_field_value_id: UUID | None = None
    # `custom_field_values.value_text` or `custom_field_values.value_int` or ...
    value: CFValueType = None

    @field_validator("value", mode="before")
    @classmethod
    def convert_value(cld, value, info: ValidationInfo) -> CFValueType:
        if value and info.data["type"] == CustomFieldType.monetary:
            return float(value)

        return value


CustomFieldTupleType: TypeAlias = tuple[CFNameType, CFValueType, CustomFieldType]


class DocumentCFV(BaseModel):
    id: UUID
    title: str
    # created_at: datetime
    # updated_at: datetime
    # parent_id: UUID | None
    # user_id: UUID
    document_type_id: UUID | None = None
    thumbnail_url: str | None = None
    custom_fields: list[CustomFieldTupleType]

    @field_validator("custom_fields", mode="before")
    @classmethod
    def convert_value(cld, value, info: ValidationInfo) -> CFValueType:
        if value:
            new_value: list[CustomFieldTupleType] = []
            for item in value:
                if item[2] == CustomFieldType.monetary and item[1]:
                    new_item: CustomFieldTupleType = (item[0], float(item[1]), item[2])
                    new_value.append(new_item)
                else:
                    new_item: CustomFieldTupleType = (item[0], item[1], item[2])
                    new_value.append(new_item)

            return new_value

        return value


class DocumentCustomFieldsAddValue(BaseModel):
    custom_field_id: UUID  # custom field ID here, NOT custom field *value* ID!
    value: str


class DocumentCustomFieldsAdd(BaseModel):
    document_type_id: UUID | None = None
    custom_fields: list[DocumentCustomFieldsAddValue]


class DocumentCustomFieldsUpdateValue(BaseModel):
    custom_field_value_id: UUID
    value: str


class DocumentCustomFieldsUpdate(BaseModel):
    custom_field_value_id: UUID | None = None
    key: CFNameType
    value: CFValueType
