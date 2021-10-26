from rest_framework_json_api import serializers

from papermerge.core.models import User


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        resource_name = 'users'
        fields = (
            'id',
            'username',
            'inbox_folder',
            'home_folder',
            'first_name',
            'last_name',
            'email',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined'
        )
