from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from papermerge.core.features.document.db.orm import Document, DocumentVersion, Page
from papermerge.core.features.tags.db.orm import Tag
from papermerge.core.features.document import schema as doc_schema

from .common import get_ancestors
