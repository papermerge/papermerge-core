from rest_framework import serializers
from dynamic_preferences.users.serializers import UserPreferenceSerializer
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.openapi import OpenApiTypes


class CustomUserPreferenceSerializer(UserPreferenceSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        resource_name = 'preferences'
        fields = [
            'id',
            'default',
            'value',
            'help_text',
        ]

    @extend_schema_field(OpenApiTypes.STR)
    def get_default(self, o):
        return o.preference.api_repr(o.preference.get("default"))

    @extend_schema_field(OpenApiTypes.STR)
    def get_identifier(self, o):
        return o.preference.identifier()

    @extend_schema_field(OpenApiTypes.STR)
    def get_help_text(self, o):
        return o.preference.get("help_text")

    @extend_schema_field(OpenApiTypes.STR)
    def get_additional_data(self, o):
        return o.preference.get_api_additional_data()

    @extend_schema_field(OpenApiTypes.STR)
    def get_field(self, o):
        return o.preference.get_api_field_data()
