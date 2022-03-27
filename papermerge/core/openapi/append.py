"""
OpenAPI components appended during openapi schema generation.

Learn more about OpenAPI components:
    https://swagger.io/docs/specification/components/
"""

JSONAPI_COMPONENTS = {
    "schemas": {
        "jsonapi": {
            "type": "object",
            "description": "The server's implementation",
            "properties": {
                "version": {"type": "string"},
                "meta": {"$ref": "#/components/schemas/meta"},
            },
            "additionalProperties": False,
        },
        "resource": {
            "type": "object",
            "required": ["type", "id"],
            "additionalProperties": False,
            "properties": {
                "type": {"$ref": "#/components/schemas/type"},
                "id": {"$ref": "#/components/schemas/id"},
                "attributes": {
                    "type": "object",
                    # ...
                },
                "relationships": {
                    "type": "object",
                    # ...
                },
                "links": {"$ref": "#/components/schemas/links"},
                "meta": {"$ref": "#/components/schemas/meta"},
            },
        },
        "link": {
            "oneOf": [
                {
                    "description": "a string containing the link's URL",
                    "type": "string",
                    "format": "uri-reference",
                },
                {
                    "type": "object",
                    "required": ["href"],
                    "properties": {
                        "href": {
                            "description": "a string containing the link's URL",
                            "type": "string",
                            "format": "uri-reference",
                        },
                        "meta": {"$ref": "#/components/schemas/meta"},
                    },
                },
            ]
        },
        "links": {
            "type": "object",
            "additionalProperties": {"$ref": "#/components/schemas/link"},
        },
        "reltoone": {
            "description": "a singular 'to-one' relationship",
            "type": "object",
            "properties": {
                "links": {"$ref": "#/components/schemas/relationshipLinks"},
                "data": {"$ref": "#/components/schemas/relationshipToOne"},
                "meta": {"$ref": "#/components/schemas/meta"},
            },
        },
        "relationshipToOne": {
            "description": "reference to other resource in a to-one relationship",  # noqa
            "anyOf": [
                {"$ref": "#/components/schemas/nulltype"},
                {"$ref": "#/components/schemas/linkage"},
            ],
        },
        "reltomany": {
            "description": "a multiple 'to-many' relationship",
            "type": "object",
            "properties": {
                "links": {"$ref": "#/components/schemas/relationshipLinks"},
                "data": {"$ref": "#/components/schemas/relationshipToMany"},
                "meta": {"$ref": "#/components/schemas/meta"},
            },
        },
        "relationshipLinks": {
            "description": "optional references to other resource objects",
            "type": "object",
            "additionalProperties": True,
            "properties": {
                "self": {"$ref": "#/components/schemas/link"},
                "related": {"$ref": "#/components/schemas/link"},
            },
        },
        "relationshipToMany": {
            "description": "An array of objects each containing the "
            "'type' and 'id' for to-many relationships",
            "type": "array",
            "items": {"$ref": "#/components/schemas/linkage"},
            "uniqueItems": True,
        },
        # A RelationshipView uses a ResourceIdentifierObjectSerializer
        # (hence the name ResourceIdentifierObject returned
        # by get_component_name()) which serializes type and
        # id. These can be lists or individual items depending on whether the
        # relationship is toMany or toOne so offer both options since we are
        # not iterating over all the possible {related_field}'s but rather
        # rendering one path schema which may represent to Many and toOne
        # relationships.
        "ResourceIdentifierObject": {
            "oneOf": [
                {"$ref": "#/components/schemas/relationshipToOne"},
                {"$ref": "#/components/schemas/relationshipToMany"},
            ]
        },
        "linkage": {
            "type": "object",
            "description": "the 'type' and 'id'",
            "required": ["type", "id"],
            "properties": {
                "type": {"$ref": "#/components/schemas/type"},
                "id": {"$ref": "#/components/schemas/id"},
                "meta": {"$ref": "#/components/schemas/meta"},
            },
        },
        "pagination": {
            "type": "object",
            "properties": {
                "first": {"$ref": "#/components/schemas/pageref"},
                "last": {"$ref": "#/components/schemas/pageref"},
                "prev": {"$ref": "#/components/schemas/pageref"},
                "next": {"$ref": "#/components/schemas/pageref"},
            },
        },
        "pageref": {
            "oneOf": [
                {"type": "string", "format": "uri-reference"},
                {"$ref": "#/components/schemas/nulltype"},
            ]
        },
        "failure": {
            "type": "object",
            "required": ["errors"],
            "properties": {
                "errors": {"$ref": "#/components/schemas/errors"},
                "meta": {"$ref": "#/components/schemas/meta"},
                "jsonapi": {"$ref": "#/components/schemas/jsonapi"},
                "links": {"$ref": "#/components/schemas/links"},
            },
        },
        "errors": {
            "type": "array",
            "items": {"$ref": "#/components/schemas/error"},
            "uniqueItems": True,
        },
        "error": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "id": {"type": "string"},
                "status": {"type": "string"},
                "links": {"$ref": "#/components/schemas/links"},
                "code": {"type": "string"},
                "title": {"type": "string"},
                "detail": {"type": "string"},
                "source": {
                    "type": "object",
                    "properties": {
                        "pointer": {
                            "type": "string",
                            "description": "A [JSON Pointer](https://tools.ietf.org/html/rfc6901) "  # noqa
                            "to the associated entity in the request document "
                            "[e.g. `/data` for a primary data object, or "
                            "`/data/attributes/title` for a specific attribute.",  # noqa
                        },
                        "parameter": {
                            "type": "string",
                            "description": "A string indicating which query parameter "  # noqa
                            "caused the error.",
                        },
                        "meta": {"$ref": "#/components/schemas/meta"},
                    },
                },
            },
        },
        "onlymeta": {
            "additionalProperties": False,
            "properties": {"meta": {"$ref": "#/components/schemas/meta"}},
        },
        "meta": {"type": "object", "additionalProperties": True},
        "datum": {
            "description": "singular item",
            "properties": {"data": {"$ref": "#/components/schemas/resource"}},
        },
        "nulltype": {"type": "object", "nullable": True, "default": None},
        "type": {
            "type": "string",
            "description": "The [type]"
            "(https://jsonapi.org/format/#document-resource-object-identification) "  # noqa
            "member is used to describe resource objects that share common attributes "  # noqa
            "and relationships.",
        },
        "id": {
            "type": "string",
            "description": "Each resource object’s type and id pair MUST "
            "[identify]"
            "(https://jsonapi.org/format/#document-resource-object-identification) "  # noqa
            "a single, unique resource.",
        },
    },
    "parameters": {
        "include": {
            "name": "include",
            "in": "query",
            "description": "[list of included related resources]"
            "(https://jsonapi.org/format/#fetching-includes)",
            "required": False,
            "style": "form",
            "schema": {"type": "string"},
        },
        # TODO: deepObject not well defined/supported:
        #       https://github.com/OAI/OpenAPI-Specification/issues/1706
        "fields": {
            "name": "fields",
            "in": "query",
            "description": "[sparse fieldsets]"
            "(https://jsonapi.org/format/#fetching-sparse-fieldsets).\n"
            "Use fields[\\<typename\\>]=field1,field2,...,fieldN",
            "required": False,
            "style": "deepObject",
            "schema": {
                "type": "object",
            },
            "explode": True,
        },
        "sort": {
            "name": "sort",
            "in": "query",
            "description": "[list of fields to sort by]"
            "(https://jsonapi.org/format/#fetching-sorting)",
            "required": False,
            "style": "form",
            "schema": {"type": "string"},
        },
    },
}
