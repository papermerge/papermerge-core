from rest_framework import serializers

from papermerge.core.models import Automate


class AutomateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Automate
        resource_name = 'automates'
        fields = (
            'id',
            'name',
            'match',
            'matching_algorithm',
            'is_case_sensitive',
            'dst_folder',
        )
