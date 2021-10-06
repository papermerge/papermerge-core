from rest_framework import serializers

from papermerge.core.models import (Document, User)


class UserSerializer(serializers.ModelSerializer):

    documents = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Document.objects.all()
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'documents']
