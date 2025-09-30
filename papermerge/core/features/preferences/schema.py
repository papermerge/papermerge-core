from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class DateFormat(str, Enum):
    ISO = "YYYY-MM-DD"
    US_LONG = "MM/DD/YYYY"
    US_SHORT = "MM/DD/YY"
    EU_LONG1 = "DD/MM/YYYY"
    EU_LONG2 = "DD.MM.YYYY"
    EU_SHORT1 = "DD/MM/YY"
    EU_SHORT2 = "DD.MM.YY"
    LONG = "MMMM DD, YYYY"


class UILanguage(str, Enum):
    EN = "en"
    DE = "de"



class Preferences(BaseModel):
    """User or system preferences"""
    date_format: str = Field(
        default="YYYY-MM-DD",
        description="Date format display"
    )
    number_format: str = Field(
        default="en-US",
        description="Number format locale"
    )
    timezone: str = Field(
        default="UTC",
        description="User timezone"
    )
    ui_language: str = Field(
        default="en",
        description="UI language"
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

    @field_validator('ui_language')
    @classmethod
    def validate_ui_language(cls, v):
        allowed = [fmt.value for fmt in UILanguage]
        if v not in allowed:
            raise ValueError(f"Invalid UI language. Allowed: {allowed}")
        return v


class PreferencesUpdate(BaseModel):
    """Partial preferences update (all fields optional)"""
    date_format: Optional[str] = None
    number_format: Optional[str] = None
    timezone: Optional[str] = None
    ui_language: Optional[str] = None

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
            allowed = allowed = [fmt.value for fmt in DateFormat]
            if v not in allowed:
                raise ValueError(f"Invalid date format. Allowed: {allowed}")
        return v

    @field_validator('ui_language')
    @classmethod
    def validate_ui_language(cls, v):
        if v is not None:
            allowed = [fmt.value for fmt in UILanguage]
            if v not in allowed:
                raise ValueError(f"Invalid UI language. Allowed: {allowed}")
        return v


class UserPreferencesResponse(BaseModel):
    """Response model for user preferences"""
    user_id: str
    preferences: Preferences
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class SystemPreferencesResponse(BaseModel):
    """Response model for system preferences"""
    singleton: bool
    preferences: Preferences
    description: Optional[str] = None
    created_at: str
    updated_at: str
    updated_by: Optional[str] = None

    model_config = {"from_attributes": True}
