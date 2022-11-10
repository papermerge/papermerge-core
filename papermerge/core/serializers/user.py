from rest_framework.serializers import Serializer
from rest_framework_json_api import serializers
from drf_spectacular.utils import OpenApiExample

from papermerge.core.models import User
from .permission import PermissionSerializer
from .group import GroupSerializer


class UserSerializer(serializers.ModelSerializer):
    user_permissions = PermissionSerializer(many=True, read_only=True)
    perm_codenames = serializers.ListField(
        child=serializers.CharField(max_length=200),
        read_only=True
    )

    included_serializers = {
        'groups': GroupSerializer
    }

    class Meta:
        model = User
        resource_name = 'users'
        fields = (
            'username',
            'inbox_folder',
            'home_folder',
            'first_name',
            'last_name',
            'email',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
            'user_permissions',
            'groups',
            'perm_codenames'
        )
        read_only_fields = ('inbox_folder', 'home_folder', 'date_joined')


data_user_response_example = OpenApiExample(
    'Response example',
    summary='Current user response example',
    description='Please add description',
    value={
        'data': {
            'type': 'users',
            'id': '0d76a122-629d-401a-b122-55c7afabd570',
            'attributes': {
                'username': 'eugen',
                'first_name': '',
                'last_name': '',
                'email': 'eugen@mail.com',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
                'date_joined': '2022-06-08T06:15:05.855523+02:00',
                'user_permissions': [],
                'perm_codenames': []
            },
        },
        'relationships': {
            'inbox_folder': {
                'data': {
                    'type': "folders",
                    'id': '70a2e21f-2786-422c-9353-ede77cc8aab2'
                }
            },
            'home_folder': {
                'data': {
                    'type': 'folders',
                    'id': 'b4aaabe3-a8f1-48bf-8d10-b191a0d4ffbd'
                }
             },
            'groups': {
                'data': [],
                'meta': {
                    'count': 0
                },
            }
        }
    }
)


class Data_UserSerializer(Serializer):
    data = UserSerializer()
