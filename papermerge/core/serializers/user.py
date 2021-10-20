from rest_framework_json_api.serializers import ModelSerializer

from papermerge.core.models import User


class UserSerializer(ModelSerializer):

    class Meta:
        model = User
        resource_name = 'users'
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined'
        )
