from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.search.db.api import search_documents
from papermerge.core.features.custom_fields.db.api import \
    update_document_custom_field_values
from papermerge.core.features.document.db.api import get_doc_ver_lang, \
    set_doc_ver_lang, get_last_doc_ver
from .common import has_node_perm
from .engine import get_db

DBRouterAsyncSession = Annotated[AsyncSession, Depends(get_db)]


__all__ = [
    "DBRouterAsyncSession",
    "AsyncSession",
    "search_documents",
    "update_document_custom_field_values",
    "has_node_perm",
    "get_doc_ver_lang",
    "set_doc_ver_lang",
    "get_last_doc_ver",
]
