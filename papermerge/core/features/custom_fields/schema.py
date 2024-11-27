from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CustomFieldType(str, Enum):
    text = "text"
    date = "date"
    boolean = "boolean"
    int = "int"
    float = "float"
    monetary = "monetary"
    # for salaries: e.g. "February, 2023"
    yearmonth = "yearmonth"


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
