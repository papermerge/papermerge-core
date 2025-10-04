from typing import Any, Type

from .base import CustomFieldTypeHandler, ValidationResult
from .config import IntegerConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class IntegerTypeHandler(CustomFieldTypeHandler[IntegerConfig]):

    @property
    def type_id(self) -> str:
        return "integer"

    @property
    def config_model(self) -> Type[IntegerConfig]:
        return IntegerConfig

    def to_storage(self, value: Any, config: IntegerConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        try:
            int_value = int(value)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid integer value: {value}")

        return CustomFieldValueData(
            raw=int_value,
            sortable=str(int_value),
            metadata={
                "prefix": config.prefix,
                "suffix": config.suffix,
                "use_thousand_separator": config.use_thousand_separator
            }
        )

    def from_storage(self, data: CustomFieldValueData, config: IntegerConfig) -> int:
        return data.raw

    def validate(self, value: Any, config: IntegerConfig) -> ValidationResult:
        if value is None:
            if config.required:
                return ValidationResult(is_valid=False, error="Value is required")
            return ValidationResult(is_valid=True)

        try:
            int_value = int(value)
        except (ValueError, TypeError):
            return ValidationResult(is_valid=False, error="Must be a valid integer")

        # Check range
        if config.min_value is not None and int_value < config.min_value:
            return ValidationResult(
                is_valid=False,
                error=f"Value must be at least {config.min_value}"
            )

        if config.max_value is not None and int_value > config.max_value:
            return ValidationResult(
                is_valid=False,
                error=f"Value must be at most {config.max_value}"
            )

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_numeric"
