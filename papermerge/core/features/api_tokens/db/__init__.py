"""API tokens database module."""
from papermerge.core.features.api_tokens.db.orm import APIToken
from papermerge.core.features.api_tokens.db import api

__all__ = ["APIToken", "api"]
