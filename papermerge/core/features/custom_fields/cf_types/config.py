from decimal import Decimal
from datetime import date
from typing import Optional, Literal

from pydantic import BaseModel, Field


class TextConfig(BaseModel):
    """Configuration for text type"""
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    pattern: Optional[str] = None
    pattern_error: Optional[str] = None
    multiline: bool = False
    required: bool = False


class IntegerConfig(BaseModel):
    """Configuration for integer type"""
    min_value: Optional[int] = None
    max_value: Optional[int] = None
    use_thousand_separator: bool = False
    prefix: str = ""
    suffix: str = ""
    required: bool = False


class NumberConfig(BaseModel):
    """Configuration for number/float type"""
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    precision: int = Field(default=2, ge=0, le=10)
    use_thousand_separator: bool = False
    prefix: str = ""
    suffix: str = ""
    required: bool = False


class MonetaryConfig(BaseModel):
    """Configuration for monetary type"""
    currency: str = "USD"
    precision: int = Field(default=2, ge=0, le=6)
    show_symbol: bool = True
    symbol_position: Literal["before", "after"] = "before"
    min_value: Optional[Decimal] = None
    max_value: Optional[Decimal] = None
    required: bool = False


class DateConfig(BaseModel):
    """Configuration for date type"""
    min_date: Optional[date] = None
    max_date: Optional[date] = None
    required: bool = False


class DateTimeConfig(BaseModel):
    """Configuration for datetime type"""
    min_datetime: Optional[str] = None  # ISO format
    max_datetime: Optional[str] = None  # ISO format
    timezone: str = "UTC"
    required: bool = False


class BooleanConfig(BaseModel):
    """Configuration for boolean type"""
    required: bool = False


class SelectOption(BaseModel):
    """Single option for select/multiselect"""
    value: str
    label: str
    color: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None


class SelectConfig(BaseModel):
    """Configuration for select type"""
    options: list[SelectOption] = Field(default_factory=list)
    allow_custom: bool = False
    required: bool = False


class MultiSelectConfig(BaseModel):
    """Configuration for multiselect type"""
    options: list[SelectOption] = Field(default_factory=list)
    allow_custom: bool = False
    min_selections: Optional[int] = None
    max_selections: Optional[int] = None
    separator: str = ", "
    required: bool = False


class URLConfig(BaseModel):
    """Configuration for URL type"""
    require_scheme: bool = True
    require_domain: bool = True
    allowed_schemes: list[str] = Field(default_factory=lambda: ["http", "https"])
    required: bool = False


class EmailConfig(BaseModel):
    """Configuration for email type"""
    allowed_domains: list[str] = Field(default_factory=list)
    required: bool = False


class YearMonthConfig(BaseModel):
    """Configuration for yearmonth type"""
    min_date: Optional[str] = None  # YYYY-MM format
    max_date: Optional[str] = None  # YYYY-MM format
    required: bool = False
