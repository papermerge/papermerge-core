from typing import Any, Type

from .base import CustomFieldTypeHandler, ValidationResult
from .config import SelectConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class SelectTypeHandler(CustomFieldTypeHandler[SelectConfig]):

    @property
    def type_id(self) -> str:
        return "select"

    @property
    def config_model(self) -> Type[SelectConfig]:
        return SelectConfig

    def to_storage(self, value: Any, config: SelectConfig) -> CustomFieldValueData:
        if value is None or value == "":
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        str_value = str(value)

        # Find matching option
        option = next(
            (opt for opt in config.options if opt.value == str_value),
            None
        )

        if option:
            metadata = {
                "label": option.label,
                "color": option.color,
                "icon": option.icon,
                "description": option.description
            }
            sortable = option.label.lower()
        else:
            metadata = {}
            sortable = str_value.lower()

        return CustomFieldValueData(
            raw=str_value,
            sortable=sortable,
            metadata=metadata
        )

    def from_storage(self, data: CustomFieldValueData, config: SelectConfig) -> str:
        return data.raw

    def validate(self, value: Any, config: SelectConfig) -> ValidationResult:
        if value is None or value == "":
            return ValidationResult(is_valid=True)

        str_value = str(value)

        if not config.allow_custom:
            valid_values = [opt.value for opt in config.options]
            if str_value not in valid_values:
                labels = [opt.label for opt in config.options]
                return ValidationResult(
                    is_valid=False,
                    error=f"Must select one of: {', '.join(labels)}"
                )

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_text"
