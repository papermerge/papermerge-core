from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator, ConfigDict

from papermerge.core.types import PaginatedQueryParams as BaseParams


class OrderBy(str, Enum):
    name_asc = "name"
    name_desc = "-name"
    type_asc = "type"
    type_desc = "-type"
    owner_asc = "group_name"
    owner_desc = "-group_name"


class PaginatedQueryParams(BaseParams):
    order_by: OrderBy | None = None



class SelectOptionInput(BaseModel):
    """
    Validated input for a select/multiselect option.

    Usage:
        options = [
            SelectOptionInput(value="high", label="High"),
            SelectOptionInput(value="low", label="Low"),
        ]
    """
    value: str = Field(..., min_length=1, description="Option key/value")
    label: str = Field(..., min_length=1, description="Display label")
    color: Optional[str] = Field(None, description="Optional color code")
    icon: Optional[str] = Field(None, description="Optional icon identifier")
    description: Optional[str] = Field(None, description="Optional description")

    model_config = ConfigDict(extra="forbid")

    def to_dict(self) -> dict:
        """Convert to dict for storage in config, excluding None values"""
        return {k: v for k, v in self.model_dump().items() if v is not None}


class SelectFieldConfig(BaseModel):
    """
    Validated configuration for a select custom field.
    """
    options: list[SelectOptionInput] = Field(..., min_length=1)
    allow_custom: bool = Field(default=False)
    required: bool = Field(default=False)

    model_config = ConfigDict(extra="forbid")

    @field_validator("options")
    @classmethod
    def no_duplicate_values(cls, v: list[SelectOptionInput]) -> list[SelectOptionInput]:
        """Ensure no duplicate option values"""
        values = [opt.value for opt in v]
        if len(values) != len(set(values)):
            duplicates = list(set(x for x in values if values.count(x) > 1))
            raise ValueError(f"Duplicate option values: {duplicates}")
        return v

    def to_config_dict(self) -> dict:
        """Convert to config dict for CustomField.config"""
        return {
            "options": [opt.to_dict() for opt in self.options],
            "allow_custom": self.allow_custom,
            "required": self.required,
        }


class MultiSelectFieldConfig(BaseModel):
    """
    Validated configuration for a multiselect custom field.
    """
    options: list[SelectOptionInput] = Field(..., min_length=1)
    allow_custom: bool = Field(default=False)
    required: bool = Field(default=False)
    min_selections: Optional[int] = Field(default=None, ge=0)
    max_selections: Optional[int] = Field(default=None, ge=1)
    separator: str = Field(default=", ")

    model_config = ConfigDict(extra="forbid")

    @field_validator("options")
    @classmethod
    def no_duplicate_values(cls, v: list[SelectOptionInput]) -> list[SelectOptionInput]:
        """Ensure no duplicate option values"""
        values = [opt.value for opt in v]
        if len(values) != len(set(values)):
            duplicates = list(set(x for x in values if values.count(x) > 1))
            raise ValueError(f"Duplicate option values: {duplicates}")
        return v

    def to_config_dict(self) -> dict:
        """Convert to config dict for CustomField.config"""
        return {
            "options": [opt.to_dict() for opt in self.options],
            "allow_custom": self.allow_custom,
            "required": self.required,
            "min_selections": self.min_selections,
            "max_selections": self.max_selections,
            "separator": self.separator,
        }


def opt(value: str, label: str, **kwargs) -> SelectOptionInput:
    """
    Shorthand helper to create SelectOptionInput.

    Usage:
        options = [opt("high", "High"), opt("low", "Low")]

    Or with extra attributes:
        options = [
            opt("urgent", "Urgent", color="#ff0000"),
            opt("normal", "Normal", color="#00ff00"),
        ]
    """
    return SelectOptionInput(value=value, label=label, **kwargs)
