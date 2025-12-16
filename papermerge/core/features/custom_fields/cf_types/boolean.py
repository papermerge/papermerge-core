from typing import Any, Type

from sqlalchemy.sql import ColumnElement

from .base import CustomFieldTypeHandler, ValidationResult
from .config import BooleanConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class BooleanTypeHandler(CustomFieldTypeHandler[BooleanConfig]):

    @property
    def type_id(self) -> str:
        return "boolean"

    @property
    def config_model(self) -> Type[BooleanConfig]:
        return BooleanConfig

    def to_storage(self, value: Any, config: BooleanConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        # Convert to boolean
        if isinstance(value, bool):
            bool_value = value
        elif isinstance(value, str):
            bool_value = value.lower() in ('true', 'yes', '1', 'y', 't')
        elif isinstance(value, int):
            bool_value = value != 0
        else:
            bool_value = bool(value)

        return CustomFieldValueData(
            raw=bool_value,
            sortable="1" if bool_value else "0",
            metadata={}
        )

    def from_storage(self, data: CustomFieldValueData, config: BooleanConfig) -> bool:
        return data.raw

    def validate(self, value: Any, config: BooleanConfig) -> ValidationResult:
        # Boolean is always valid (converts to True/False)
        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_boolean"

    def get_filter_expression(
        self,
        column: ColumnElement,
        operator: str,
        value: Any,
        config: BooleanConfig
    ) -> ColumnElement:
        if operator == "is_checked":
            return column == True
        elif operator == "is_not_checked":
            return column != True
        else:
            raise ValueError(f"Unsupported operator: {operator}")
