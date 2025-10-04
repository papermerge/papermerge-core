from typing import Any, Type
from decimal import Decimal, InvalidOperation

from .base import CustomFieldTypeHandler, ValidationResult
from .config import NumberConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class NumberTypeHandler(CustomFieldTypeHandler[NumberConfig]):

    @property
    def type_id(self) -> str:
        return "number"

    @property
    def config_model(self) -> Type[NumberConfig]:
        return NumberConfig

    def to_storage(self, value: Any, config: NumberConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        # Convert to Decimal for precision
        try:
            decimal_value = Decimal(str(value))
        except (InvalidOperation, ValueError):
            raise ValueError(f"Invalid number value: {value}")

        # Round to precision
        decimal_value = decimal_value.quantize(Decimal(10) ** -config.precision)

        return CustomFieldValueData(
            raw=float(decimal_value),
            sortable=str(decimal_value),
            metadata={
                "precision": config.precision,
                "prefix": config.prefix,
                "suffix": config.suffix,
                "use_thousand_separator": config.use_thousand_separator
            }
        )

    def from_storage(self, data: CustomFieldValueData, config: NumberConfig) -> float:
        return data.raw

    def validate(self, value: Any, config: NumberConfig) -> ValidationResult:
        if value is None:
            if config.required:
                return ValidationResult(is_valid=False, error="Value is required")
            return ValidationResult(is_valid=True)

        try:
            float_value = float(value)
        except (ValueError, TypeError):
            return ValidationResult(is_valid=False, error="Must be a valid number")

        # Check range
        if config.min_value is not None and float_value < config.min_value:
            return ValidationResult(
                is_valid=False,
                error=f"Value must be at least {config.min_value}"
            )

        if config.max_value is not None and float_value > config.max_value:
            return ValidationResult(
                is_valid=False,
                error=f"Value must be at most {config.max_value}"
            )

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_numeric"
