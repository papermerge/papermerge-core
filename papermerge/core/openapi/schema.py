from rest_framework_json_api import serializers
from rest_framework.fields import empty
from rest_framework_json_api.utils import format_field_name
from drf_spectacular.extensions import OpenApiSerializerExtension
from drf_spectacular.extensions import OpenApiAuthenticationExtension


class KnoxTokenScheme(OpenApiAuthenticationExtension):
    target_class = 'knox.auth.TokenAuthentication'
    name = 'Token Authentication'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description':
                'Token-based authentication with required prefix Token'
        }


class GroupJsonAPISerializer(OpenApiSerializerExtension):
    target_class = 'papermerge.core.serializers.GroupSerializer'
    type = {
        "type": "string",
        "enum": ["groups"]
    }

    def map_serializer(self, auto_schema, direction):
        required = []
        attributes = {}
        relationships = {}

        for field in self.target.fields.values():
            if isinstance(field, serializers.HyperlinkedIdentityField):
                # the 'url' is not an attribute but rather a self.link,
                # so don't map it here.
                continue
            if isinstance(field, serializers.HiddenField):
                continue
            if isinstance(field, serializers.RelatedField):
                relationships[format_field_name(field.field_name)] = {
                    "$ref": "#/components/schemas/reltoone"
                }
                continue
            if isinstance(field, serializers.ManyRelatedField):
                relationships[format_field_name(field.field_name)] = {
                    "$ref": "#/components/schemas/reltomany"
                }
                continue

            if field.required:
                required.append(field.field_name)

            schema = auto_schema._map_serializer_field(field, direction)
            if field.read_only:
                schema["readOnly"] = True
            if field.write_only:
                schema["writeOnly"] = True
            if field.allow_null:
                schema["nullable"] = True
            if field.default and field.default != empty:
                schema["default"] = field.default
            if field.help_text:
                # Ensure django gettext_lazy is rendered correctly
                schema["description"] = str(field.help_text)

            auto_schema._insert_field_validators(field, schema)

            attributes[format_field_name(field.field_name)] = schema

        result = {
            "type": "object",
            "additionalProperties": False,
            "required": ["type"],
            "properties": {
                "type": self.type,
                "id": {"type": "string", "format": "uuid"}
            },
        }
        if attributes:
            result["properties"]["attributes"] = {
                "type": "object",
                "properties": attributes,
            }
            if required:
                result["properties"]["attributes"]["required"] = required

        if relationships:
            result["properties"]["relationships"] = {
                "type": "object",
                "properties": relationships,
            }

        return result


class TagJsonAPISerializer(GroupJsonAPISerializer):
    type = {
        "type": "string",
        "enum": ["tags"]
    }
    target_class = 'papermerge.core.serializers.TagSerializer'


class RolesJsonAPISerializer(GroupJsonAPISerializer):
    type = {
        "type": "string",
        "enum": ["roles"]
    }
    target_class = 'papermerge.core.serializers.RoleSerializer'


class UserJsonAPISerializer(GroupJsonAPISerializer):
    type = {
        "type": "string",
        "enum": ["users"]
    }
    target_class = 'papermerge.core.serializers.UserSerializer'


class DocumentDetailsJsonAPISerializer(GroupJsonAPISerializer):
    type = {
        "type": "string",
        "enum": ["documents"]
    }
    target_class = 'papermerge.core.serializers.DocumentDetailsSerializer'


class FolderJsonAPISerializer(GroupJsonAPISerializer):
    type = {
        "type": "string",
        "enum": ["folders"]
    }
    target_class = 'papermerge.core.serializers.FolderSerializer'


class NodeJsonAPISerializer(GroupJsonAPISerializer):
    type = {
        "type": "string",
        # TODO: change "Document" to "documents" to be consistent with other
        # resource names
        "enum": ["Document", "documents", "folders"]

    }
    target_class = 'papermerge.core.serializers.NodeSerializer'


class PageJsonAPISerializer(GroupJsonAPISerializer):
    type = {
        "type": "string",
        "enum": ["pages"]
    }
    target_class = 'papermerge.core.serializers.PageSerializer'


class TokenJsonAPISerializer(GroupJsonAPISerializer):
    type = {
        "type": "string",
        "enum": ["tokens"]
    }
    target_class = 'papermerge.core.serializers.TokenSerializer'


class CustomUserPreferenceSerializer(OpenApiSerializerExtension):

    target_class = 'papermerge.core.serializers.CustomUserPreferenceSerializer'

    def map_serializer(self, auto_schema, direction):
        response = {
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'string',
                },
                'type': {
                    'type': 'string'
                },
                'attributes': {
                    'type': 'object',
                    'properties': {
                        'section': {
                            'type': 'string',
                            'readOnly': True
                        },
                        'identifier': {
                            'type': 'string',
                            'readOnly': True
                        },
                        'default': {
                            'type': 'string',
                            'readOnly': True
                        },
                        'help_text': {
                            'type': 'string',
                            'readOnly': True,
                            'nullable': True
                        },
                        'value': {
                            'type': 'string',
                            'readOnly': True
                        },
                        'name': {
                            'type': 'string',
                            'readOnly': True
                        }
                    }
                }
            }
        }

        return response
