from django.contrib.auth.models import Permission

from papermerge.test import TestCase
from papermerge.core.serializers import UserSerializer

from model_bakery import baker


def _perm(name):
    return Permission.objects.get(codename=name)


class TestUserSerializer(TestCase):

    def test_user_perm_serialization(self):
        user = baker.make('core.user')
        gr1 = baker.make('group')
        gr2 = baker.make('group')
        gr1.permissions.add(_perm('view_user'))
        gr2.permissions.add(_perm('view_group'))
        user.groups.add(gr1, gr2)

        serializer = UserSerializer(user)

        expected_perms = set(['view_user', 'view_group'])

        actual_perms = set(serializer.data['perm_codenames'])

        assert expected_perms == actual_perms
