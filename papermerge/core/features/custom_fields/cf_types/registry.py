from typing import Dict, Type

from pydantic import BaseModel

from .base import CustomFieldTypeHandler


class TypeHandlerInfo(BaseModel):
    """Information about a registered type handler"""
    type_id: str
    config_model_name: str
    sort_column: str

    class Config:
        frozen = True


class TypeRegistry:
    """
    Central registry for all custom field type handlers

    Provides type-safe registration and retrieval of handlers
    """

    _handlers: Dict[str, CustomFieldTypeHandler] = {}

    @classmethod
    def register(cls, handler_class: Type[CustomFieldTypeHandler]):
        """
        Register a new type handler (decorator pattern)

        Usage:
            @TypeRegistry.register
            class MyTypeHandler(CustomFieldTypeHandler[MyConfig]):
                ...

        Args:
            handler_class: Type handler class to register

        Returns:
            The handler class (for decorator pattern)
        """
        handler = handler_class()

        # Validate handler has required properties
        if not handler.type_id:
            raise ValueError(f"Handler {handler_class.__name__} must define type_id")

        if not handler.config_model:
            raise ValueError(f"Handler {handler_class.__name__} must define config_model")

        # Check for duplicate registration
        if handler.type_id in cls._handlers:
            existing = cls._handlers[handler.type_id]
            raise ValueError(
                f"Type handler '{handler.type_id}' is already registered "
                f"by {existing.__class__.__name__}"
            )

        cls._handlers[handler.type_id] = handler
        return handler_class

    @classmethod
    def get_handler(cls, type_id: str) -> CustomFieldTypeHandler:
        """
        Get handler for a specific type

        Args:
            type_id: Type identifier (e.g., 'text', 'monetary')

        Returns:
            Type handler instance

        Raises:
            ValueError: If type_id is not registered
        """
        if type_id not in cls._handlers:
            available = list(cls._handlers.keys())
            raise ValueError(
                f"Unknown custom field type: '{type_id}'. "
                f"Available types: {', '.join(available)}"
            )
        return cls._handlers[type_id]

    @classmethod
    def has_handler(cls, type_id: str) -> bool:
        """
        Check if a handler is registered

        Args:
            type_id: Type identifier

        Returns:
            True if handler is registered
        """
        return type_id in cls._handlers

    @classmethod
    def get_all_handlers(cls) -> Dict[str, CustomFieldTypeHandler]:
        """
        Get all registered handlers

        Returns:
            Dictionary mapping type_id -> handler instance
        """
        return cls._handlers.copy()

    @classmethod
    def list_types(cls) -> list[TypeHandlerInfo]:
        """
        List all available types with metadata

        Returns:
            List of TypeHandlerInfo Pydantic models
        """
        return [
            TypeHandlerInfo(
                type_id=handler.type_id,
                config_model_name=handler.config_model.__name__,
                sort_column=handler.get_sort_column()
            )
            for handler in cls._handlers.values()
        ]

    @classmethod
    def get_type_ids(cls) -> list[str]:
        """
        Get list of all registered type IDs

        Returns:
            List of type identifiers
        """
        return list(cls._handlers.keys())

    @classmethod
    def clear(cls):
        """
        Clear all registered handlers

        Warning: This is primarily for testing purposes
        """
        cls._handlers.clear()

    @classmethod
    def validate_config(cls, type_id: str, config: dict) -> BaseModel:
        """
        Validate configuration for a specific type

        Args:
            type_id: Type identifier
            config: Configuration dictionary

        Returns:
            Validated configuration as Pydantic model

        Raises:
            ValueError: If type_id not registered or config invalid
        """
        handler = cls.get_handler(type_id)
        return handler.parse_config(config)


# Convenience function for easier imports
def get_handler(type_id: str) -> CustomFieldTypeHandler:
    """
    Convenience function to get a type handler

    Args:
        type_id: Type identifier

    Returns:
        Type handler instance
    """
    return TypeRegistry.get_handler(type_id)
