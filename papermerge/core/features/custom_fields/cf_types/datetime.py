# papermerge/core/features/custom_fields/types/datetime.py

from datetime import datetime
from typing import Any, Type

from .base import CustomFieldTypeHandler, ValidationResult
from .config import DateTimeConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class DateTimeTypeHandler(CustomFieldTypeHandler[DateTimeConfig]):

    @property
    def type_id(self) -> str:
        return "datetime"

    @property
    def config_model(self) -> Type[DateTimeConfig]:
        return DateTimeConfig

    def to_storage(self, value: Any, config: DateTimeConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        # Parse datetime
        if isinstance(value, str):
            # Support ISO format: 2024-12-15T14:30:00
            dt_value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        elif isinstance(value, datetime):
            dt_value = value
        else:
            raise ValueError(f"Cannot convert {type(value)} to datetime")

        return CustomFieldValueData(
            raw=dt_value.isoformat(),
            sortable=dt_value.isoformat(),
            metadata={
                "year": dt_value.year,
                "month": dt_value.month,
                "day": dt_value.day,
                "hour": dt_value.hour,
                "minute": dt_value.minute,
                "timezone": config.timezone
            }
        )

    def from_storage(self, data: CustomFieldValueData, config: DateTimeConfig) -> datetime:
        if data.raw is None:
            return None
        return datetime.fromisoformat(data.raw)

    def validate(self, value: Any, config: DateTimeConfig) -> ValidationResult:
        if value is None:
            if config.required:
                return ValidationResult(is_valid=False, error="DateTime is required")
            return ValidationResult(is_valid=True)

        # Parse datetime
        try:
            if isinstance(value, str):
                datetime.fromisoformat(value.replace('Z', '+00:00'))
            elif not isinstance(value, datetime):
                return ValidationResult(is_valid=False, error="Invalid datetime format")
        except ValueError:
            return ValidationResult(
                is_valid=False,
                error="Invalid datetime format (expected ISO: YYYY-MM-DDTHH:MM:SS)"
            )

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_datetime"
