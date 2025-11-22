from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.tests.types import AuthTestClient
from papermerge.core.features.preferences.db import api as pref_dbapi


async def test_update_my_preferences_ui_language(
        auth_api_client: AuthTestClient,
        db_session: AsyncSession
):
    """Test updating user's ui_language preference to 'de'"""

    # Prepare the request payload
    payload = {
        "ui_language": "de"
    }

    # Send PUT request to update preferences
    response = await  auth_api_client.patch(
        "/preferences/me",
        json=payload
    )

    # Assert request was successful
    assert response.status_code == 200, response.json()

    # Assert response contains the updated preference
    response_data = response.json()
    assert response_data["ui_language"] == "de"

    # Verify the preference was actually updated in the database
    user_prefs = await pref_dbapi.get_user_preferences(
        db_session,
        auth_api_client.user.id
    )
    assert user_prefs["ui_language"] == "de"
