from uuid import UUID
from typing import Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from papermerge.core.features.preferences.db.orm import UserPreferences, \
    SystemPreferences
from papermerge.core.features.preferences.schema import Preferences, \
    PreferencesUpdate

# Default preferences constant
DEFAULTS = {
    'date_format': 'YYYY-MM-DD',
    'number_format': 'eu_dot',
    'timezone': 'UTC',
    'ui_language': 'en',
}


async def get_user_preferences(
    db_session: AsyncSession,
    user_id: UUID
) -> Dict[str, Any]:
    """Get user-specific preferences only"""
    stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    result = await db_session.execute(stmt)
    user_prefs = result.scalar_one_or_none()

    if user_prefs and user_prefs.preferences:
        return user_prefs.preferences
    return {}


async def get_system_preferences(db_session: AsyncSession) -> Dict[str, Any]:
    """Get system-wide preferences"""
    stmt = select(SystemPreferences).where(SystemPreferences.singleton == True)
    result = await db_session.execute(stmt)
    system_prefs = result.scalar_one_or_none()

    if system_prefs and system_prefs.preferences:
        return system_prefs.preferences
    return DEFAULTS.copy()


async def get_merged_preferences(
    db_session: AsyncSession,
    user_id: UUID
) -> tuple[Dict[str, Any], Dict[str, str]]:
    """
    Get merged preferences for a user with precedence:
    1. User preferences (highest)
    2. System preferences
    3. Hardcoded defaults (lowest)

    Returns: (preferences_dict, sources_dict)
    """
    # Start with defaults
    merged = DEFAULTS.copy()
    sources = {key: 'default' for key in DEFAULTS}

    # Apply system preferences
    system_prefs = await get_system_preferences(db_session)
    for key, value in system_prefs.items():
        merged[key] = value
        sources[key] = 'system'

    # Apply user preferences (highest priority)
    user_prefs = await get_user_preferences(db_session, user_id)
    for key, value in user_prefs.items():
        merged[key] = value
        sources[key] = 'user'

    return merged, sources


async def update_user_preferences(
    db_session: AsyncSession,
    user_id: UUID,
    preferences: PreferencesUpdate
) -> UserPreferences:
    """
    Update user preferences

    Args:
        db_session: Async database session
        user_id: User UUID
        preferences: New preferences
        merge: If True, merge with existing; if False, replace completely
    """
    stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    result = await db_session.execute(stmt)
    user_prefs = result.scalar_one_or_none()
    new_pref_dict = preferences.model_dump(exclude_none=True)

    if user_prefs:
        previous_prefs = user_prefs.preferences or {}
        # SqlAlchemy detects change (and saves it) only
        # if `user_prefs.preferences` is a new object
        new_dictionary_object = {**previous_prefs, **new_pref_dict}
        user_prefs.preferences = new_dictionary_object
    else:
        # Create new user preferences
        user_prefs = UserPreferences(
            user_id=user_id,
            preferences=new_pref_dict
        )
        db_session.add(user_prefs)

    await db_session.commit()
    await db_session.refresh(user_prefs)
    return user_prefs


async def delete_user_preference(
    db_session: AsyncSession,
    user_id: UUID,
    key: str
) -> bool:
    """Delete a specific user preference key"""
    stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    result = await db_session.execute(stmt)
    user_prefs = result.scalar_one_or_none()

    if user_prefs and user_prefs.preferences and key in user_prefs.preferences:
        prefs = user_prefs.preferences.copy()
        del prefs[key]
        user_prefs.preferences = prefs
        await db_session.commit()
        return True
    return False


async def reset_user_preferences(
    db_session: AsyncSession,
    user_id: UUID
) -> None:
    """Reset user preferences to empty (will fall back to system/defaults)"""
    stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    result = await db_session.execute(stmt)
    user_prefs = result.scalar_one_or_none()

    if user_prefs:
        await db_session.delete(user_prefs)
        await db_session.commit()


async def get_merged_preferences_as_model(
    db_session: AsyncSession,
    user_id: UUID
) -> Preferences:
    """
    Get merged preferences for a user as a Pydantic model

    Precedence:
    1. User preferences (highest)
    2. System preferences
    3. Hardcoded defaults (lowest)

    Returns: Preferences model
    """
    # Start with defaults
    merged = DEFAULTS.copy()

    # Apply system preferences
    system_prefs = await get_system_preferences(db_session)
    merged.update(system_prefs)

    # Apply user preferences (highest priority)
    user_prefs = await get_user_preferences(db_session, user_id)
    merged.update(user_prefs)

    # Convert to Pydantic model
    return Preferences(**merged)
