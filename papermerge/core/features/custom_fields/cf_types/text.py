# papermerge/core/features/custom_fields/types/text.py

from typing import Any, Type
import re

from .base import CustomFieldTypeHandler, ValidationResult
from .config import TextConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class TextTypeHandler(CustomFieldTypeHandler[TextConfig]):

    @property
    def type_id(self) -> str:
        return "text"

    @property
    def config_model(self) -> Type[TextConfig]:
        return TextConfig

    def to_storage(self, value: Any, config: TextConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        str_value = str(value).strip()

        # Truncate if needed
        if config.max_length and len(str_value) > config.max_length:
            truncated = str_value[:config.max_length]
            return CustomFieldValueData(
                raw=truncated,
                sortable=truncated.lower(),
                metadata={
                    "truncated": True,
                    "original_length": len(str_value)
                }
            )

        return CustomFieldValueData(
            raw=str_value,
            sortable=str_value.lower(),
            metadata={}
        )

    def from_storage(self, data: CustomFieldValueData, config: TextConfig) -> str:
        return data.raw

    def validate(self, value: Any, config: TextConfig) -> ValidationResult:
        if value is None:
            if config.required:
                return ValidationResult(is_valid=False, error="Text is required")
            return ValidationResult(is_valid=True)

        str_value = str(value).strip()

        # Check length
        if config.min_length and len(str_value) < config.min_length:
            return ValidationResult(
                is_valid=False,
                error=f"Text must be at least {config.min_length} characters"
            )

        if config.max_length and len(str_value) > config.max_length:
            return ValidationResult(
                is_valid=False,
                error=f"Text must be at most {config.max_length} characters"
            )

        # Check pattern
        if config.pattern:
            if not re.match(config.pattern, str_value):
                error_msg = config.pattern_error or "Text format is invalid"
                return ValidationResult(is_valid=False, error=error_msg)

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_text"
