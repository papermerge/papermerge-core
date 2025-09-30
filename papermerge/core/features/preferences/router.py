from typing import Annotated

from fastapi import APIRouter, Depends, Security, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, utils
from papermerge.core.features.auth import scopes
from papermerge.core.features.preferences.db import api as pref_dbapi
from papermerge.core.features.auth import get_current_user
from papermerge.core.db.engine import get_db
from .schema import Preferences, PreferencesUpdate, SystemPreferencesResponse

router = APIRouter(
    prefix="/preferences",
    tags=["preferences"],
)


@router.get("/me", response_model=Preferences)
async def get_my_preferences(
    current_user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.USER_ME])
    ],
    db: AsyncSession = Depends(get_db)
):
    """Get current user's merged preferences (user + system + defaults)"""
    return await pref_dbapi.get_merged_preferences_as_model(db, current_user.id)


@router.put("/me", response_model=Preferences)
async def update_my_preferences(
    preferences: PreferencesUpdate,
    current_user: Annotated[
      schema.User, Security(get_current_user, scopes=[scopes.USER_ME])
    ],
    db_session: AsyncSession = Depends(get_db)
):
    """Update current user's preferences"""
    # Convert Pydantic model to dict, excluding None values
    prefs_dict = preferences.model_dump(exclude_none=True)

    if not prefs_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No preferences provided"
        )

    await pref_dbapi.update_user_preferences(
        db_session=db_session,
        user_id=current_user.id,
        preferences=prefs_dict,
        merge=True
    )

    # Return the merged preferences
    return await pref_dbapi.get_merged_preferences_as_model(
        db_session,
        current_user.id
    )


@router.delete("/me/{key}")
async def delete_my_preference(
    key: str,
    current_user: Annotated[
      schema.User, Security(get_current_user, scopes=[scopes.USER_ME])
    ],
    db_session: AsyncSession = Depends(get_db)
):
    """Delete a specific preference key (will fall back to system/default)"""
    deleted = await pref_dbapi.delete_user_preference(db_session, current_user.id, key)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preference key '{key}' not found"
        )

    return {"message": f"Preference '{key}' deleted successfully"}


@router.delete("/me", response_model=Preferences)
async def reset_my_preferences(
    current_user:  Annotated[
      schema.User, Security(get_current_user, scopes=[scopes.USER_ME])
    ],
    db_session: AsyncSession = Depends(get_db)
):
    """Reset all user preferences to system/default values"""
    await pref_dbapi.reset_user_preferences(db_session, current_user.id)

    # Return the merged preferences (now defaults)
    return await pref_dbapi.get_merged_preferences_as_model(db_session, current_user.id)


# Admin endpoints
@router.get("/system", response_model=SystemPreferencesResponse)
@utils.docstring_parameter(scope=scopes.SYSTEM_PREFERENCE_VIEW)
async def get_system_preferences(
    current_admin: Annotated[
      schema.User, Security(get_current_user, scopes=[scopes.SYSTEM_PREFERENCE_VIEW])
    ],
    db_session: AsyncSession = Depends(get_db),
):
    """Get system-wide default preferences (admin only)

    Required scope: `{scope}`
    """
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


@router.put("/system", response_model=SystemPreferencesResponse)
@utils.docstring_parameter(scope=scopes.SYSTEM_PREFERENCE_UPDATE)
async def update_system_preferences(
    current_admin: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.SYSTEM_PREFERENCE_UPDATE])
    ],
    preferences: PreferencesUpdate,
    db_session: AsyncSession = Depends(get_db),
):
    """Update system-wide default preferences (admin only)

    Required scope: `{scope}`
    """
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
