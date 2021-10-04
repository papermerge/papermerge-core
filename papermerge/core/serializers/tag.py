from rest_framework import serializers

from papermerge.core.models import Tag


class TagSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tag
        fields = [
            'id',
            'name',
            'bg_color',
            'fg_color',
            'description',
            'pinned',
        ]
