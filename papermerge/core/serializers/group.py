from django.contrib.auth.models import Group

from rest_framework_json_api.serializers import ModelSerializer


class GroupSerializer(ModelSerializer):

    class Meta:
        model = Group
        resource_name = 'groups'
        fields = ('id', 'name')
