from uuid import UUID
from pydantic import BaseModel, ConfigDict


class CustomField(BaseModel):
    id: UUID
    name: str
    data_type: str
    extra_data: str | None

    # Config
    model_config = ConfigDict(from_attributes=True)


class CreateCustomField(BaseModel):
    name: str
    data_type: str
    extra_data: str | None

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateCustomField(BaseModel):
    name: str
    data_type: str
    extra_data: str | None

    # Config
    model_config = ConfigDict(from_attributes=True)
