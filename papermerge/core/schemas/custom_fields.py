from enum import Enum
from uuid import UUID
from pydantic import BaseModel, ConfigDict



class CustomFieldType(str, Enum):
    string = 'string'
    url = 'url'
    date = 'date'
    int = 'int'
    float = 'float'
    monetary = 'monetary'
    select = 'select'
    document_link = 'document_link'


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
    extra_data: str | None

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateCustomField(BaseModel):
    name: str | None = None
    data_type: CustomFieldType | None = None
    extra_data: str | None = None
