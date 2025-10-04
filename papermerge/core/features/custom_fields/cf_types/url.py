from typing import Any, Type
from urllib.parse import urlparse

from .base import CustomFieldTypeHandler, ValidationResult
from .config import URLConfig
from .registry import TypeRegistry
from papermerge.core.features.custom_fields.schema import CustomFieldValueData


@TypeRegistry.register
class URLTypeHandler(CustomFieldTypeHandler[URLConfig]):

    @property
    def type_id(self) -> str:
        return "url"

    @property
    def config_model(self) -> Type[URLConfig]:
        return URLConfig

    def to_storage(self, value: Any, config: URLConfig) -> CustomFieldValueData:
        if value is None:
            return CustomFieldValueData(raw=None, sortable=None, metadata={})

        url = str(value).strip()

        # Parse URL
        try:
            parsed = urlparse(url)
            domain = parsed.netloc or parsed.path.split('/')[0] if parsed.path else ""
            scheme = parsed.scheme
            path = parsed.path
        except Exception:
            # If parsing fails, store what we can
            domain = url
            scheme = None
            path = None

        return CustomFieldValueData(
            raw=url,
            sortable=url.lower(),
            metadata={
                "domain": domain,
                "scheme": scheme,
                "path": path,
                "has_scheme": bool(scheme)
            }
        )

    def from_storage(self, data: CustomFieldValueData, config: URLConfig) -> str:
        return data.raw

    def validate(self, value: Any, config: URLConfig) -> ValidationResult:
        if value is None:
            if config.required:
                return ValidationResult(is_valid=False, error="URL is required")
            return ValidationResult(is_valid=True)

        url = str(value).strip()

        # Basic URL validation
        try:
            parsed = urlparse(url)

            # Check scheme if required
            if config.require_scheme:
                if not parsed.scheme:
                    return ValidationResult(
                        is_valid=False,
                        error="URL must include protocol (e.g., http:// or https://)"
                    )

            # Check allowed schemes
            if parsed.scheme:
                if parsed.scheme not in config.allowed_schemes:
                    schemes_str = ', '.join(config.allowed_schemes)
                    return ValidationResult(
                        is_valid=False,
                        error=f"URL scheme must be one of: {schemes_str}"
                    )

            # Check domain if required
            if config.require_domain:
                if not parsed.netloc:
                    return ValidationResult(
                        is_valid=False,
                        error="URL must include a domain"
                    )

        except Exception:
            return ValidationResult(is_valid=False, error="Invalid URL format")

        return ValidationResult(is_valid=True)

    def get_sort_column(self) -> str:
        return "value_text"
