from django.contrib.auth.models import Group

from rest_framework.serializers import ModelSerializer


class GroupSerializer(ModelSerializer):

    class Meta:
        model = Group
        resource_name = 'group'
        fields = ('id', 'name')
