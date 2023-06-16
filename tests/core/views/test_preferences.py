import pytest
from django.urls import reverse

from papermerge.test import TestCase, perms


@pytest.mark.skip()
class PreferencesViewPermissionsTestCase(TestCase):

    def test_preferences_view_forbidden_for_default_user(self):
        response = self.client.get(reverse('preferences-list'))
        assert response.status_code == 403

    @perms('view_userpreferencemodel')
    def test_prefs_view_allowed_for_user_with_view_perm(self):
        response = self.client.get(reverse('preferences-list'))
        assert response.status_code == 200
