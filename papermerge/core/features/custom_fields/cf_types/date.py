from datetime import date, datetime
from typing import Any, Type

from sqlalchemy.sql import ColumnElement
from sqlalchemy import cast, Date

from .base import CustomFieldTypeHandler, ValidationResult
from .config import DateConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class DateTypeHandler(CustomFieldTypeHandler[DateConfig]):

    @property
    def type_id(self) -> str:
        return "date"

    @property
    def config_model(self) -> Type[DateConfig]:
        return DateConfig

    def to_storage(self, value: Any, config: DateConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        # Convert to date
        if isinstance(value, str):
            date_value = datetime.strptime(value, "%Y-%m-%d").date()
        elif isinstance(value, datetime):
            date_value = value.date()
        elif isinstance(value, date):
            date_value = value
        else:
            raise ValueError(f"Cannot convert {type(value)} to date")

        return CustomFieldValueData(
            raw=date_value.isoformat(),
            sortable=date_value.isoformat(),
            metadata={
                "year": date_value.year,
                "month": date_value.month,
                "day": date_value.day,
                "weekday": date_value.strftime("%A")
            }
        )

    def from_storage(self, data: CustomFieldValueData, config: DateConfig) -> date:
        if data.raw is None:
            return None
        return datetime.strptime(data.raw, "%Y-%m-%d").date()

    def validate(self, value: Any, config: DateConfig) -> ValidationResult:
        if value is None:
            if config.required:
                return ValidationResult(is_valid=False, error="Date is required")
            return ValidationResult(is_valid=True)

        # Parse date
        try:
            if isinstance(value, str):
                date_value = datetime.strptime(value, "%Y-%m-%d").date()
            elif isinstance(value, (date, datetime)):
                date_value = value if isinstance(value, date) else value.date()
            else:
                return ValidationResult(is_valid=False, error="Invalid date format")
        except ValueError:
            return ValidationResult(
                is_valid=False,
                error="Invalid date format (expected YYYY-MM-DD)"
            )

        # Check range
        if config.min_date and date_value < config.min_date:
            return ValidationResult(
                is_valid=False,
                error=f"Date must be on or after {config.min_date}"
            )

        if config.max_date and date_value > config.max_date:
            return ValidationResult(
                is_valid=False,
                error=f"Date must be on or before {config.max_date}"
            )

        return ValidationResult(is_valid=True)

    def get_filter_expression(
        self,
        column: ColumnElement,
        operator: str,
        value: Any,
        config: DateConfig
    ) -> ColumnElement:
        # Handle null checks without converting value
        if operator == "is_null":
            return column.is_(None)
        elif operator == "is_not_null":
            return column.isnot(None)

        # Convert to Python date object
        try:
            if isinstance(value, str):
                date_value = datetime.strptime(value, "%Y-%m-%d").date()
            elif isinstance(value, datetime):
                date_value = value.date()
            elif isinstance(value, date):
                date_value = value
            else:
                raise ValueError(f"Cannot convert {type(value)} to date")
        except (ValueError, TypeError) as ex:
            raise ValueError(f"Invalid date value '{value}': {ex}")

        # Cast the column to Date type and compare with Python date object
        date_column = cast(column, Date)

        if operator == "eq":
            return date_column == date_value
        elif operator == "ne":
            return date_column != date_value
        elif operator == "gt":
            return date_column > date_value
        elif operator == "gte":
            return date_column >= date_value
        elif operator == "lt":
            return date_column < date_value
        elif operator == "lte":
            return date_column <= date_value
        else:
            raise ValueError(f"Unsupported operator for date: {operator}")


    def get_sort_column(self) -> str:
        return "value_date"
