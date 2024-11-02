from uuid import UUID

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from papermerge.core.features.document.db.orm import Document, DocumentVersion
from papermerge.core.features.document import schema as doc_schema
