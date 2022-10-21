from rest_framework_json_api.pagination import JsonApiPageNumberPagination


class JsonApiPagination(JsonApiPageNumberPagination):
    """
    A JSON:API compatible pagination with schema included
    """

    def get_paginated_response_schema(self, schema):
        return {
            'type': 'object',
            'properties': {
                'data': schema,
                'meta': {
                    'type': 'object',
                    'properties': {
                        'pagination': {
                            'type': 'object',
                            'properties': {
                                'page': {
                                    'type': 'integer',
                                    'example': 1
                                },
                                'pages': {
                                    'type': 'integer',
                                    'example': 10
                                },
                                'count': {
                                    'type': 'integer',
                                    'example': 100
                                }
                            }
                        }
                    }
                },
                'links': {
                    'type': 'object',
                    'properties': {
                        'next': {
                            'type': 'string',
                            'nullable': True,
                            'format': 'uri',
                            'example': 'http://api.example.org/accounts/?{page_query_param}=4'.format(  # noqa
                                page_query_param=self.page_query_param)
                        },
                        'prev': {
                            'type': 'string',
                            'nullable': True,
                            'format': 'uri',
                            'example': 'http://api.example.org/accounts/?{page_query_param}=2'.format(   # noqa
                                page_query_param=self.page_query_param)
                        },
                        'first': {
                            'type': 'string',
                            'nullable': True,
                            'format': 'uri',
                            'example': 'http://api.example.org/accounts/?{page_query_param}=2'.format(   # noqa
                                page_query_param=self.page_query_param)
                        },
                        'last': {
                            'type': 'string',
                            'nullable': True,
                            'format': 'uri',
                            'example': 'http://api.example.org/accounts/?{page_query_param}=2'.format(  # noqa
                                page_query_param=self.page_query_param)
                        },
                    }
                },
            }
        }
