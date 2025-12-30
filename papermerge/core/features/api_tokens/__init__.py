"""
API Tokens feature - Personal Access Tokens (PAT) for Papermerge.

This feature allows users to create long-lived tokens for API access,
enabling CLI tools, scripts, and third-party integrations to authenticate
without going through OIDC flows.

Usage:
    # In a script or CLI tool
    curl -H "Authorization: Bearer pm_xxxxx..." https://papermerge.example.com/api/...

Components:
- db/orm.py: SQLAlchemy model for api_tokens table
- db/api.py: Database operations (CRUD)
- schema.py: Pydantic schemas for request/response
- router.py: FastAPI endpoints
"""
from papermerge.core.features.api_tokens.db.orm import APIToken
from papermerge.core.features.api_tokens.db import api as db_api
from papermerge.core.features.api_tokens import schema
from papermerge.core.features.api_tokens.router import router

__all__ = ["APIToken", "db_api", "schema", "router"]
