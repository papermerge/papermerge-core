"""
Custom OpenAPI schema generator that automatically documents
required scopes from Security() dependencies.
"""

from typing import Dict, Any
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def create_custom_openapi_generator(app: FastAPI):
    """
    Creates a custom OpenAPI schema generator function.

    This function will be assigned to app.openapi to override
    FastAPI's default OpenAPI generation behavior.

    The custom generator:
    1. Extracts scopes from Security() dependencies
    2. Adds them prominently to endpoint descriptions
    3. Ensures consistent documentation across all endpoints

    Args:
        app: FastAPI application instance

    Returns:
        A function that generates the custom OpenAPI schema
    """

    def custom_openapi() -> Dict[str, Any]:
        # Return cached schema if already generated
        if app.openapi_schema:
            return app.openapi_schema

        # Generate base OpenAPI schema using FastAPI's default logic
        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )

        # Enhance the schema with scope documentation
        for path, path_item in openapi_schema.get("paths", {}).items():
            for method in ["get", "post", "put", "delete", "patch", "options", "head"]:
                if method not in path_item:
                    continue

                operation = path_item[method]

                # Extract required scopes from security requirements
                scopes = _extract_scopes_from_operation(operation)

                if scopes:
                    # Format scope documentation
                    scope_list = ", ".join(f"`{scope}`" for scope in scopes)
                    scope_doc = f"\n\n**Required Scope(s):** {scope_list}"

                    # Append to existing description
                    current_desc = operation.get("description", "")
                    operation["description"] = current_desc + scope_doc

        # Cache the enhanced schema
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    return custom_openapi


def _extract_scopes_from_operation(operation: Dict[str, Any]) -> list[str]:
    """
    Extract all required scopes from an OpenAPI operation's security requirements.

    Example operation["security"]:
    [
        {"OAuth2PasswordBearer": ["node.view", "node.update"]},
        {"ApiKeyAuth": []}
    ]

    Args:
        operation: OpenAPI operation object

    Returns:
        List of unique scope strings (preserving order)
    """
    scopes = []

    for security_requirement in operation.get("security", []):
        for scheme_name, scope_list in security_requirement.items():
            scopes.extend(scope_list)

    # Remove duplicates while preserving order
    return list(dict.fromkeys(scopes))
