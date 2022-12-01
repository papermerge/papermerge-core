from drf_spectacular.utils import extend_schema

from django.db import transaction

from rest_framework.decorators import action

from dynamic_preferences.users.viewsets import UserPreferencesViewSet

from papermerge.core.serializers import CustomUserPreferenceSerializer
from papermerge.core.auth import CustomModelPermissions


OPENAPI_PREFERENCE = {
    'type': 'object',
    'properties': {
        'ocr__language': {
            'type': 'string'
        },
        'ocr__trigger': {
            'type': 'string',
            'enum': ['auto', 'manual']
        },
        'localization__data_format': {
            'type': 'string'
        },
        'localization__time_format': {
            'type': 'string'
        },
        'localization__timezone': {
            'type': 'string'
        },
    }
}


class CustomUserPreferencesViewSet(UserPreferencesViewSet):
    serializer_class = CustomUserPreferenceSerializer
    permission_classes = [CustomModelPermissions]

    @extend_schema(
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'data': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'additional_data': {
                                    'type': 'object',
                                    'properties': {
                                        'choices': {
                                            'type': 'array'
                                        }
                                    }
                                },
                                'default': {
                                    'type': 'string'
                                },
                                'field': {
                                    'type': 'object',
                                    'properties': {
                                        'class': {
                                            'type': 'string'
                                        },
                                        'input_type': {
                                            'type': 'string'
                                        }
                                    }
                                },
                                'help_text': {
                                    'type': 'string'
                                },
                                'id': {
                                    'type': 'string'
                                },
                                'identifier': {
                                    'type': 'string'
                                },
                                'name': {
                                    'type': 'string'
                                },
                                'section': {
                                    'type': 'string'
                                },
                                'value': {
                                    'type': 'string'
                                },
                            }
                        }
                    }
                }
            },
        },
        request={
            'application/vnd.api+json': OPENAPI_PREFERENCE,
            'application/json': OPENAPI_PREFERENCE
        }
    )
    @action(detail=False, methods=["post"])
    @transaction.atomic
    def bulk(self, request, *args, **kwargs):
        return super().bulk(request, *args, **kwargs)
