from typing import Any, Type
import re

from .base import CustomFieldTypeHandler, ValidationResult
from .config import EmailConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class EmailTypeHandler(CustomFieldTypeHandler[EmailConfig]):

    # RFC 5322 compliant email regex (simplified)
    EMAIL_REGEX = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )

    @property
    def type_id(self) -> str:
        return "email"

    @property
    def config_model(self) -> Type[EmailConfig]:
        return EmailConfig

    def to_storage(self, value: Any, config: EmailConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        # Normalize email (lowercase, strip whitespace)
        email = str(value).strip().lower()

        # Extract parts
        if '@' in email:
            local_part, domain = email.split('@', 1)
        else:
            local_part = email
            domain = None

        return CustomFieldValueData(
            raw=email,
            sortable=email,
            metadata={
                "domain": domain,
                "local_part": local_part,
                "has_valid_format": bool(self.EMAIL_REGEX.match(email))
            }
        )

    def from_storage(self, data: CustomFieldValueData, config: EmailConfig) -> str:
        return data.raw

    def validate(self, value: Any, config: EmailConfig) -> ValidationResult:
        if value is None:
            if config.required:
                return ValidationResult(is_valid=False, error="Email is required")
            return ValidationResult(is_valid=True)

        email = str(value).strip().lower()

        # Check if empty string
        if not email:
            if config.required:
                return ValidationResult(is_valid=False, error="Email is required")
            return ValidationResult(is_valid=True)

        # Basic email format validation
        if not self.EMAIL_REGEX.match(email):
            return ValidationResult(
                is_valid=False,
                error="Invalid email format"
            )

        # Check allowed domains if configured
        if config.allowed_domains:
            if '@' not in email:
                return ValidationResult(
                    is_valid=False,
                    error="Invalid email format"
                )

            domain = email.split('@')[1]
            if domain not in config.allowed_domains:
                domains_str = ', '.join(config.allowed_domains)
                return ValidationResult(
                    is_valid=False,
                    error=f"Email domain must be one of: {domains_str}"
                )

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_text"
