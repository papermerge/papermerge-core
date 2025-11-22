from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema
from papermerge.core.features.auth import scopes
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.preferences.db import api as pref_dbapi
from papermerge.core.db.engine import get_db
from papermerge.core.features.auth.dependencies import require_scopes
from .schema import Preferences, PreferencesUpdate, SystemPreferencesResponse, \
    TimezonesResponse, UILanguageResponse, DateFormatResponse, \
    TimestampFormatResponse, NumberFormatResponse
from .timezone import TimezoneService
from .ui_language import get_ui_languages
from .date_format import get_date_formats
from .timestamp_format import get_timestamp_formats
from .number_format import get_number_formats

router = APIRouter(
    prefix="/preferences",
    tags=["preferences"],
)


@router.get("/me", response_model=Preferences)
async def get_my_preferences(
    current_user: Annotated[schema.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get current user's merged preferences (user + system + defaults)"""
    return await pref_dbapi.get_merged_preferences_as_model(db, current_user.id)


@router.patch("/me", response_model=Preferences)
async def update_my_preferences(
    preferences: PreferencesUpdate,
    current_user: Annotated[schema.User, Depends(get_current_user)],
    db_session: AsyncSession = Depends(get_db)
) -> Preferences:
    """Update current user's preferences"""
    await pref_dbapi.update_user_preferences(
        db_session=db_session,
        user_id=current_user.id,
        preferences=preferences
    )

    # Return the merged preferences
    ret: Preferences = await pref_dbapi.get_merged_preferences_as_model(
        db_session,
        current_user.id
    )

    return ret


@router.get("/system", response_model=SystemPreferencesResponse)
async def get_system_preferences(
    current_admin: require_scopes(scopes.SYSTEM_PREFERENCE_VIEW),
    db_session: AsyncSession = Depends(get_db),
):
    """Get system-wide default preferences (admin only)"""
    from sqlalchemy import select
    from papermerge.core.features.preferences.db.orm import SystemPreferences

    stmt = select(SystemPreferences).where(SystemPreferences.singleton == True)
    result = await db_session.execute(stmt)
    system_prefs = result.scalar_one_or_none()

    if not system_prefs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="System preferences not found"
        )

    return SystemPreferencesResponse.model_validate(system_prefs)


@router.patch("/system", response_model=SystemPreferencesResponse)
async def update_system_preferences(
    current_admin: require_scopes(scopes.SYSTEM_PREFERENCE_UPDATE),
    preferences: PreferencesUpdate,
    db_session: AsyncSession = Depends(get_db),
):
    """Update system-wide default preferences (admin only)"""
    from sqlalchemy import select
    from papermerge.core.features.preferences.db.orm import SystemPreferences

    prefs_dict = preferences.model_dump(exclude_none=True)

    if not prefs_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No preferences provided"
        )

    stmt = select(SystemPreferences).where(SystemPreferences.singleton == True)
    result = await db_session.execute(stmt)
    system_prefs = result.scalar_one_or_none()

    if system_prefs:
        current = system_prefs.preferences or {}
        current.update(prefs_dict)
        system_prefs.preferences = current
        system_prefs.updated_by = current_admin.id
    else:
        system_prefs = SystemPreferences(
            singleton=True,
            preferences=prefs_dict,
            description="System-wide default preferences",
            updated_by=current_admin.id
        )
        db_session.add(system_prefs)

    await db_session.commit()
    await db_session.refresh(system_prefs)

    return SystemPreferencesResponse.model_validate(system_prefs)


@router.get(
    "/options/timezone",
    response_model=TimezonesResponse,
    summary="Get available timezones",
    description="Returns popular IANA timezones for user selection"
)
async def get_timezones():
    """
    Get available timezones for user selection.

    Returns a curated list of popular timezones including:
    - Major cities in North America
    - Major cities in Europe
    - Major cities in Asia
    - Major cities in Oceania
    - Major cities in Africa

    Each timezone includes its current UTC offset.
    """
    timezones = TimezoneService.get_timezones()

    return TimezonesResponse(timezones=timezones)


@router.get("/options/ui-language")
async def get_ui_languages_endpoint() -> UILanguageResponse:
    """
    Get available UI Languages
    """
    languages = get_ui_languages()

    return UILanguageResponse(languages=languages)


@router.get("/options/date-format")
async def get_date_formats_endpoint() -> DateFormatResponse:
    """
    Get available date formats.
    """
    date_formats = get_date_formats()
    return DateFormatResponse(date_formats=date_formats)


@router.get("/options/timestamp-format")
async def get_timestamp_formats_endpoint() -> TimestampFormatResponse:
    """
    Get available timestamp formats
    """
    timestamp_formats = get_timestamp_formats()
    return TimestampFormatResponse(timestamp_formats=timestamp_formats)


@router.get("/options/number-format")
async def get_number_formats_endpoint() -> NumberFormatResponse:
    """
    Get available number formats
    """
    number_formats = get_number_formats()
    return NumberFormatResponse(number_formats=number_formats)
