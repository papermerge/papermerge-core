from abc import ABC, abstractmethod
from typing import Any, Optional, Type, TypeVar, Generic

from pydantic import BaseModel
from sqlalchemy.sql import ColumnElement

from papermerge.core.features.custom_fields.schema import CustomFieldValueData

ConfigT = TypeVar('ConfigT', bound=BaseModel)


class ValidationResult(BaseModel):
    """Result of validation"""
    is_valid: bool
    error: Optional[str] = None


class CustomFieldTypeHandler(ABC, Generic[ConfigT]):
    """
    Base class for all custom field type handlers

    Generic over ConfigT which should be a Pydantic model
    """

    @property
    @abstractmethod
    def type_id(self) -> str:
        """Unique identifier for this type (e.g., 'text', 'monetary')"""
        pass

    @property
    @abstractmethod
    def config_model(self) -> Type[ConfigT]:
        """Pydantic model class for configuration validation"""
        pass

    @abstractmethod
    def to_storage(self, value: Any, config: ConfigT) -> CustomFieldValueData:
        """
        Convert Python value to storage format (Pydantic model)

        Args:
            value: The input value
            config: Validated configuration (Pydantic model)

        Returns:
            CustomFieldValueData with:
            - raw: The actual typed value
            - sortable: String used for sorting (optional)
            - metadata: Additional type-specific data
        """
        pass

    @abstractmethod
    def from_storage(self, data: CustomFieldValueData, config: ConfigT) -> Any:
        """
        Convert storage format back to Python value

        Args:
            data: The stored data (Pydantic model)
            config: Validated configuration (Pydantic model)

        Returns:
            Python value of appropriate type
        """
        pass

    @abstractmethod
    def validate(self, value: Any, config: ConfigT) -> ValidationResult:
        """
        Validate a value against this type's rules

        Args:
            value: Value to validate
            config: Validated configuration (Pydantic model)

        Returns:
            ValidationResult with is_valid and optional error message
        """
        pass

    @abstractmethod
    def get_sort_column(self) -> str:
        """
        Which generated column to use for sorting

        Returns: 'value_text', 'value_numeric', 'value_date', 'value_datetime', or 'value_boolean'
        """
        pass

    def parse_config(self, config_dict: dict) -> ConfigT:
        """
        Parse and validate configuration dict into Pydantic model

        Args:
            config_dict: Raw configuration dictionary

        Returns:
            Validated configuration model

        Raises:
            ValidationError: If configuration is invalid
        """
        return self.config_model(**config_dict)

    def get_filter_expression(
        self,
        column: ColumnElement,
        operator: str,
        value: Any,
        config: ConfigT
    ) -> ColumnElement:
        """
        Build SQLAlchemy filter expression

        Args:
            column: The generated column (value_text, value_numeric, etc.)
            operator: Filter operator ('eq', 'gt', 'lt', 'like', etc.)
            value: Filter value
            config: Validated configuration (Pydantic model)
        """
        if operator == "eq":
            return column == value
        elif operator == "ne":
            return column != value
        elif operator == "gt":
            return column > value
        elif operator == "gte":
            return column >= value
        elif operator == "lt":
            return column < value
        elif operator == "lte":
            return column <= value
        elif operator == "in":
            return column.in_(value)
        elif operator == "not_in":
            return ~column.in_(value)
        elif operator == "is_null":
            return column.is_(None)
        elif operator == "is_not_null":
            return column.isnot(None)
        elif operator == "ilike":
            return column.ilike(f"%{value}%")
        elif operator == "not_ilike":
            return ~column.ilike(f"%{value}%")
        else:
            raise ValueError(f"Unsupported operator: {operator}")

    def get_default_config(self) -> ConfigT:
        """Return default configuration as Pydantic model"""
        return self.config_model()
