from typing import Any, Type

from .base import CustomFieldTypeHandler, ValidationResult
from .config import MultiSelectConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class MultiSelectTypeHandler(CustomFieldTypeHandler[MultiSelectConfig]):

    @property
    def type_id(self) -> str:
        return "multiselect"

    @property
    def config_model(self) -> Type[MultiSelectConfig]:
        return MultiSelectConfig

    def to_storage(self, value: Any, config: MultiSelectConfig) -> CustomFieldValueData:
        if value is None or value == [] or value == "":
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        # Ensure value is a list
        if isinstance(value, str):
            values = [v.strip() for v in value.split(",") if v.strip()]
        elif isinstance(value, list):
            values = [str(v) for v in value]
        else:
            values = [str(value)]

        # Build metadata from options
        labels = []
        colors = []
        icons = []

        for val in values:
            option = next(
                (opt for opt in config.options if opt.value == val),
                None
            )
            if option:
                labels.append(option.label)
                if option.color:
                    colors.append(option.color)
                if option.icon:
                    icons.append(option.icon)
            else:
                labels.append(val)

        # Create sortable string (sorted for consistency)
        sortable = ",".join(sorted(values))

        return CustomFieldValueData(
            raw=values,  # List of selected values
            sortable=sortable,
            metadata={
                "count": len(values),
                "labels": labels,
                "colors": colors if colors else None,
                "icons": icons if icons else None,
                "separator": config.separator
            }
        )

    def from_storage(self, data: CustomFieldValueData, config: MultiSelectConfig) -> list:
        if data.raw is None:
            return []
        return data.raw

    def validate(self, value: Any, config: MultiSelectConfig) -> ValidationResult:
        if value is None or value == [] or value == "":
            return ValidationResult(is_valid=True)

        # Convert to list
        if isinstance(value, str):
            values = [v.strip() for v in value.split(",") if v.strip()]
        elif isinstance(value, list):
            values = [str(v) for v in value]
        else:
            values = [str(value)]

        # Check if empty after processing
        if not values and config.required:
            return ValidationResult(
                is_valid=False,
                error="At least one selection is required"
            )

        # Check min/max selections
        if config.min_selections and len(values) < config.min_selections:
            return ValidationResult(
                is_valid=False,
                error=f"Must select at least {config.min_selections} option(s)"
            )

        if config.max_selections and len(values) > config.max_selections:
            return ValidationResult(
                is_valid=False,
                error=f"Must select at most {config.max_selections} option(s)"
            )

        # Check valid options if custom values not allowed
        if not config.allow_custom:
            valid_values = [opt.value for opt in config.options]
            invalid = [v for v in values if v not in valid_values]
            if invalid:
                return ValidationResult(
                    is_valid=False,
                    error=f"Invalid selections: {', '.join(invalid)}"
                )

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_text"
