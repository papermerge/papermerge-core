"""
Custom field type handlers

This module provides the type registry and all built-in type handlers.
"""

from .registry import TypeRegistry, get_handler, TypeHandlerInfo
from .base import CustomFieldTypeHandler, ValidationResult

# Import all built-in handlers to trigger registration
from .text import TextTypeHandler
from .integer import IntegerTypeHandler
from .number import NumberTypeHandler
from .boolean import BooleanTypeHandler
from .date import DateTypeHandler
from .datetime import DateTimeTypeHandler
from .monetary import MonetaryTypeHandler
from .select import SelectTypeHandler
from .multiselect import MultiSelectTypeHandler
from .url import URLTypeHandler
from .email import EmailTypeHandler
from .yearmonth import YearMonthTypeHandler
from .short_text import ShortTextTypeHandler


__all__ = [
    'TypeRegistry',
    'get_handler',
    'TypeHandlerInfo',
    'CustomFieldTypeHandler',
    'ValidationResult',
    # Built-in handlers
    'TextTypeHandler',
    'ShortTextTypeHandler',
    'IntegerTypeHandler',
    'NumberTypeHandler',
    'BooleanTypeHandler',
    'DateTypeHandler',
    'DateTimeTypeHandler',
    'MonetaryTypeHandler',
    'SelectTypeHandler',
    'MultiSelectTypeHandler',
    'URLTypeHandler',
    'EmailTypeHandler',
    'YearMonthTypeHandler',
]


def get_available_types() -> list[TypeHandlerInfo]:
    """
    Get list of all available custom field types

    Returns:
        List of TypeHandlerInfo Pydantic models
    """
    return TypeRegistry.list_types()


def validate_type_config(type_id: str, config: dict):
    """
    Validate configuration for a type

    Args:
        type_id: Type identifier
        config: Configuration dictionary

    Returns:
        Validated Pydantic config model
    """
    return TypeRegistry.validate_config(type_id, config)
