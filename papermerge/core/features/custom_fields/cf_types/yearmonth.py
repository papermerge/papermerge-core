# papermerge/core/features/custom_fields/types/yearmonth.py

from typing import Any, Type
from datetime import datetime
import re

from .base import CustomFieldTypeHandler, ValidationResult
from .config import YearMonthConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class YearMonthTypeHandler(CustomFieldTypeHandler[YearMonthConfig]):

    # Regex for YYYY-MM format
    YEARMONTH_REGEX = re.compile(r'^[0-9]{4}-[0-9]{2}$')

    @property
    def type_id(self) -> str:
        return "yearmonth"

    @property
    def config_model(self) -> Type[YearMonthConfig]:
        return YearMonthConfig

    def to_storage(self, value: Any, config: YearMonthConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        # Parse to YYYY-MM format
        if isinstance(value, str):
            value_str = value.strip()
        elif isinstance(value, float):
            # Convert from float format (e.g., 2024.11)
            year = int(value)
            month = int(round((value - year) * 100))
            value_str = f"{year:04d}-{month:02d}"
        else:
            raise ValueError(f"Invalid yearmonth value: {value}")

        # Validate format
        if not self.YEARMONTH_REGEX.match(value_str):
            raise ValueError(f"Invalid yearmonth format: {value_str} (expected YYYY-MM)")

        # Parse components
        try:
            dt = datetime.strptime(value_str, "%Y-%m")
            year = dt.year
            month = dt.month
        except ValueError:
            raise ValueError(f"Invalid yearmonth value: {value_str}")

        return CustomFieldValueData(
            raw=value_str,  # Store as YYYY-MM string
            sortable=value_str,
            metadata={
                "year": year,
                "month": month,
                "month_name": dt.strftime("%B")
            }
        )

    def from_storage(self, data: CustomFieldValueData, config: YearMonthConfig) -> str:
        return data.raw

    def validate(self, value: Any, config: YearMonthConfig) -> ValidationResult:
        if value is None:
            if config.required:
                return ValidationResult(is_valid=False, error="Year-month is required")
            return ValidationResult(is_valid=True)

        # Convert to string format
        if isinstance(value, str):
            value_str = value.strip()
        elif isinstance(value, float):
            year = int(value)
            month = int(round((value - year) * 100))
            value_str = f"{year:04d}-{month:02d}"
        else:
            return ValidationResult(
                is_valid=False,
                error="Invalid yearmonth format"
            )

        # Validate format
        if not self.YEARMONTH_REGEX.match(value_str):
            return ValidationResult(
                is_valid=False,
                error="Invalid yearmonth format (expected YYYY-MM)"
            )

        # Validate actual date
        try:
            datetime.strptime(value_str, "%Y-%m")
        except ValueError:
            return ValidationResult(
                is_valid=False,
                error="Invalid yearmonth value"
            )

        # Check range
        if config.min_date:
            if value_str < config.min_date:
                return ValidationResult(
                    is_valid=False,
                    error=f"Year-month must be on or after {config.min_date}"
                )

        if config.max_date:
            if value_str > config.max_date:
                return ValidationResult(
                    is_valid=False,
                    error=f"Year-month must be on or before {config.max_date}"
                )

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_text"  # Sorts correctly as YYYY-MM string
