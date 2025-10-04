# papermerge/core/features/custom_fields/types/monetary.py

from decimal import Decimal, InvalidOperation
from typing import Any, Type

from .base import CustomFieldTypeHandler, ValidationResult
from .config import MonetaryConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class MonetaryTypeHandler(CustomFieldTypeHandler[MonetaryConfig]):

    CURRENCY_SYMBOLS = {
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "JPY": "¥",
        "CHF": "CHF",
        "CAD": "CA$",
        "AUD": "A$",
    }

    @property
    def type_id(self) -> str:
        return "monetary"

    @property
    def config_model(self) -> Type[MonetaryConfig]:
        return MonetaryConfig

    def to_storage(self, value: Any, config: MonetaryConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        # Convert to Decimal for precision
        try:
            decimal_value = Decimal(str(value))
        except (InvalidOperation, ValueError):
            raise ValueError(f"Invalid monetary value: {value}")

        # Round to precision
        decimal_value = decimal_value.quantize(Decimal(10) ** -config.precision)

        return CustomFieldValueData(
            raw=float(decimal_value),
            sortable=str(decimal_value),
            metadata={
                "currency": config.currency,
                "precision": config.precision,
                "symbol": self.CURRENCY_SYMBOLS.get(config.currency, config.currency)
            }
        )

    def from_storage(self, data: CustomFieldValueData, config: MonetaryConfig) -> float:
        return data.raw

    def validate(self, value: Any, config: MonetaryConfig) -> ValidationResult:
        if value is None:
            if config.required:
                return ValidationResult(is_valid=False, error="Value is required")
            return ValidationResult(is_valid=True)

        try:
            decimal_value = Decimal(str(value))
        except (InvalidOperation, ValueError):
            return ValidationResult(is_valid=False, error="Invalid monetary value")

        # Check range
        if config.min_value is not None and decimal_value < config.min_value:
            return ValidationResult(
                is_valid=False,
                error=f"Value must be at least {config.min_value}"
            )

        if config.max_value is not None and decimal_value > config.max_value:
            return ValidationResult(
                is_valid=False,
                error=f"Value must be at most {config.max_value}"
            )

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_numeric"
