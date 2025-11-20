from enum import Enum
from typing import Optional
from typing import List

from pydantic import BaseModel, Field, field_validator, ConfigDict


class DateFormat(str, Enum):
    # ISO Standard
    ISO_8601 = "YYYY-MM-DD"

    # US Formats
    US_LONG = "MM/DD/YYYY"
    US_SHORT = "MM/DD/YY"
    US_LONG_TEXT = "MMMM DD, YYYY"
    US_SHORT_TEXT = "MMM DD, YYYY"

    # European Formats (slash separator)
    EU_SLASH_LONG = "DD/MM/YYYY"
    EU_SLASH_SHORT = "DD/MM/YY"

    # European Formats (dot separator)
    EU_DOT_LONG = "DD.MM.YYYY"
    EU_DOT_SHORT = "DD.MM.YY"

    # European Formats (dash separator) - commonly used in Germany
    EU_DASH_LONG = "DD-MM-YYYY"

    # Asian Formats
    ASIA_LONG = "YYYY/MM/DD"  # Used in Japan, China, Korea
    ASIA_DOT = "YYYY.MM.DD"  # Used in China, Korea

    # Compact formats (no separators)
    COMPACT_ISO = "YYYYMMDD"


class TimestampFormat(str, Enum):
    """Timestamp display formats for audit logs and metadata fields"""

    # ISO 8601 Formats
    ISO_8601_FULL = "YYYY-MM-DD HH:mm:ss"              # 2025-09-30 14:35:42
    ISO_8601_WITH_TZ = "YYYY-MM-DD HH:mm:ss Z"         # 2025-09-30 14:35:42 +02:00
    ISO_8601_T = "YYYY-MM-DDTHH:mm:ss"                 # 2025-09-30T14:35:42
    ISO_8601_T_TZ = "YYYY-MM-DDTHH:mm:ssZ"            # 2025-09-30T14:35:42+02:00

    # Readable Formats (12-hour)
    US_LONG_12H = "MM/DD/YYYY hh:mm:ss A"             # 09/30/2025 02:35:42 PM
    US_SHORT_12H = "MM/DD/YY hh:mm A"                 # 09/30/25 02:35 PM
    US_TEXT_12H = "MMM DD, YYYY hh:mm A"              # Sep 30, 2025 02:35 PM
    US_TEXT_LONG_12H = "MMMM DD, YYYY hh:mm:ss A"    # September 30, 2025 02:35:42 PM

    # Readable Formats (24-hour)
    US_LONG_24H = "MM/DD/YYYY HH:mm:ss"               # 09/30/2025 14:35:42
    US_SHORT_24H = "MM/DD/YY HH:mm"                   # 09/30/25 14:35
    US_TEXT_24H = "MMM DD, YYYY HH:mm"                # Sep 30, 2025 14:35
    US_TEXT_LONG_24H = "MMMM DD, YYYY HH:mm:ss"      # September 30, 2025 14:35:42

    # European Formats (24-hour is standard)
    EU_SLASH_24H = "DD/MM/YYYY HH:mm:ss"              # 30/09/2025 14:35:42
    EU_SLASH_SHORT = "DD/MM/YY HH:mm"                 # 30/09/25 14:35
    EU_DOT_24H = "DD.MM.YYYY HH:mm:ss"                # 30.09.2025 14:35:42
    EU_DOT_SHORT = "DD.MM.YYYY HH:mm"                 # 30.09.2025 14:35
    EU_DASH_24H = "DD-MM-YYYY HH:mm:ss"               # 30-09-2025 14:35:42

    # Asian Formats
    ASIA_LONG = "YYYY/MM/DD HH:mm:ss"                 # 2025/09/30 14:35:42
    ASIA_SHORT = "YYYY/MM/DD HH:mm"                   # 2025/09/30 14:35

    # Compact Format
    COMPACT = "YYYYMMDDHHmmss"                        # 20250930143542

    @classmethod
    def values(cls):
        """Get all enum values as a list"""
        return [fmt.value for fmt in cls]


class NumberFormat(str, Enum):
    """Common number formatting patterns"""

    US = "us"      # US, UK, most English-speaking e.g. 1,234.56
    EU_DOT = "eu_dot"     # Germany, Spain, Italy e.g. 1.234,56
    EU_SPACE = "eu_space"   # France, Sweden, Norway e.g. 1 234,56
    SWISS = "swiss"      # Switzerland e.g. 1'234.56
    INDIAN = "indian"     # 1,23,456.78
    COMPACT = "compact"     # No separator e.g. 1234.56

    @classmethod
    def values(cls):
        return [fmt.value for fmt in cls]


class UILanguage(str, Enum):
    EN = "en"
    DE = "de"
    KK = "kk"
    RU = "ru"


class UITheme(str, Enum):
    LIGHT = "light"
    DARK = "dark"


class Preferences(BaseModel):
    """User or system preferences"""
    ui_language: str = Field(
        default="en",
        description="UI language"
    )
    timezone: str = Field(
        default="UTC",
        description="User timezone"
    )
    date_format: str = Field(
        default="YYYY-MM-DD",
        description="Date format display"
    )
    number_format: str = Field(
        default="eu_dot",
        description="Number formatting pattern"
    )
    timestamp_format: str = Field(
        default="DD.MM.YYYY HH:mm:ss",
        description="Timestamp format display"
    )
    ui_theme: str = Field(
        default="light",
        description="UI Theme"
    )
    document_default_lang: str | None = Field(
        default=None,
        description="Default language for the documents"
    )

    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, v):
        import pytz
        if v not in pytz.all_timezones:
            raise ValueError(f"Invalid timezone: {v}")
        return v

    @field_validator('date_format')
    @classmethod
    def validate_date_format(cls, v):
        allowed = [fmt.value for fmt in DateFormat]
        if v not in allowed:
            raise ValueError(f"Invalid date format. Allowed: {allowed}")
        return v

    @field_validator('number_format')
    @classmethod
    def validate_number_format(cls, v):
        allowed = NumberFormat.values()
        if v not in allowed:
            raise ValueError(f"Invalid number format. Allowed: {allowed}")
        return v

    @field_validator('timestamp_format')
    @classmethod
    def validate_timestamp_format(cls, v):
        allowed = [fmt.value for fmt in TimestampFormat]
        if v not in allowed:
            raise ValueError(f"Invalid timestamp format. Allowed: {allowed}")
        return v

    @field_validator('ui_language')
    @classmethod
    def validate_ui_language(cls, v):
        allowed = [fmt.value for fmt in UILanguage]
        if v not in allowed:
            raise ValueError(f"Invalid UI language. Allowed: {allowed}")
        return v

    @field_validator('ui_theme')
    @classmethod
    def validate_ui_theme(cls, v):
        allowed = [i.value for i in UITheme]
        if v not in allowed:
            raise ValueError(f"Invalid UI Theme. Allowed: {allowed}")
        return v

class PreferencesUpdate(BaseModel):
    """Partial preferences update (all fields optional)"""
    ui_language: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    number_format: Optional[str] = None
    timestamp_format: Optional[str] = None
    ui_theme: Optional[str] = None

    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, v):
        if v is not None:
            import pytz
            if v not in pytz.all_timezones:
                raise ValueError(f"Invalid timezone: {v}")
        return v

    @field_validator('date_format')
    @classmethod
    def validate_date_format(cls, v):
        if v is not None:
            allowed = [fmt.value for fmt in DateFormat]
            if v not in allowed:
                raise ValueError(f"Invalid date format. Allowed: {allowed}")
        return v

    @field_validator('timestamp_format')
    @classmethod
    def validate_timestamp_format(cls, v):
        if v is not None:
            allowed = [fmt.value for fmt in TimestampFormat]
            if v not in allowed:
                raise ValueError(f"Invalid timestamp format. Allowed: {allowed}")
        return v

    @field_validator('ui_language')
    @classmethod
    def validate_ui_language(cls, v):
        if v is not None:
            allowed = [fmt.value for fmt in UILanguage]
            if v not in allowed:
                raise ValueError(f"Invalid UI language. Allowed: {allowed}")
        return v

    @field_validator('ui_theme')
    @classmethod
    def validate_ui_theme(cls, v):
        if v is not None:
            allowed = [i.value for i in UITheme]
            if v not in allowed:
                raise ValueError(f"Invalid UI theme. Allowed: {allowed}")
        return v


class UserPreferencesResponse(BaseModel):
    """Response model for user preferences"""
    user_id: str
    preferences: Preferences
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class SystemPreferencesResponse(BaseModel):
    """Response model for system preferences"""
    singleton: bool
    preferences: Preferences
    description: Optional[str] = None
    created_at: str
    updated_at: str
    updated_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SelectOption(BaseModel):
    """Single dropdown option"""
    value: str
    label: str


class TimezoneOption(BaseModel):
    """Single timezone option"""
    value: str = Field(..., description="IANA timezone name (e.g., 'America/New_York')")
    label: str = Field(..., description="Display label with offset (e.g., 'New York (UTC-05:00)')")
    region: str = Field(..., description="Geographic region (e.g., 'America', 'Europe')")


class TimezonesResponse(BaseModel):
    """Response with available timezones"""
    timezones: List[TimezoneOption] = Field(
        ...,
        description="List of available timezones"
    )


class UILanguageResponse(BaseModel):
    """Response with available UI Languages"""
    languages: List[SelectOption]


class DateFormatResponse(BaseModel):
    """Response with available date formats"""
    date_formats: List[SelectOption]


class TimestampFormatResponse(BaseModel):
    """Response with available timestamp formats"""
    timestamp_formats: List[SelectOption]


class NumberFormatResponse(BaseModel):
    """Response with available number formats"""
    number_formats: List[SelectOption]
