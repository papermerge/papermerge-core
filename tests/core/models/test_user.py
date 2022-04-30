from papermerge.core.models import User
from papermerge.test import TestCase


class TestUserModel(TestCase):

    def test_basic_user_create(self):
        User.objects.create(username='me')
