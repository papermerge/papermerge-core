from uuid import UUID
from datetime import datetime
from sqlalchemy import String, TIMESTAMP, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import TSVECTOR, ARRAY

from papermerge.core.db.base import Base


class DocumentSearchIndex(Base):
    """
    Search index for documents with pre-computed tsvector.

    This table is automatically maintained by database triggers and contains
    denormalized data optimized for fast full-text search.
    """
    __tablename__ = "document_search_index"

    # Primary key
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("documents.node_id", ondelete="CASCADE"),
        primary_key=True
    )

    # Foreign keys
    document_type_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("document_types.id", ondelete="SET NULL"),
        nullable=True
    )

    # Ownership (for access control)
    owner_type: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_id: Mapped[UUID] = mapped_column(nullable=False)

    # Language for FTS configuration
    lang: Mapped[str] = mapped_column(String(10), nullable=False, default='en')

    # Searchable content (stored for debugging/display)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    document_type_name: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    custom_fields_text: Mapped[str | None] = mapped_column(String, nullable=True)

    # Pre-computed tsvector for full-text search
    search_vector: Mapped[str] = mapped_column(TSVECTOR, nullable=False)

    # Metadata
    last_updated: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )

    # Indexes
    __table_args__ = (
        # GIN index for full-text search (most important!)
        Index(
            'idx_document_search_vector',
            'search_vector',
            postgresql_using='gin'
        ),

        # Indexes for filtering
        Index('idx_document_search_owner', 'owner_type', 'owner_id'),
        Index('idx_document_search_doc_type', 'document_type_id'),
        Index('idx_document_search_lang', 'lang'),
    )
