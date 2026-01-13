import uuid
from uuid import UUID
from pathlib import Path

from sqlalchemy import ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.db.base import Base
from papermerge.core.features.document_types.db.orm import DocumentType
from papermerge.core.features.nodes.db.orm import Node
from papermerge.core.types import OCRStatusEnum, ImagePreviewStatus, \
    DocumentProcessingStatus
from papermerge.core.pathlib import abs_docver_path


class Document(Node):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
        "node_id",
        ForeignKey("nodes.id", ondelete="CASCADE"),
        primary_key=True,
        default=uuid.uuid4,
    )

    ocr: Mapped[bool] = mapped_column(default=False)
    ocr_status: Mapped[str] = mapped_column(default=OCRStatusEnum.unknown)

    # Document processing status tracking
    # Tracks the async processing lifecycle (upload -> convert -> ready)
    processing_status: Mapped[str] = mapped_column(
        Enum(DocumentProcessingStatus, name="document_processing_status"),
        default=DocumentProcessingStatus.uploaded,
        nullable=False
    )
    processing_error: Mapped[str] = mapped_column(nullable=True)

    # `preview_status`
    #  NULL   = no preview available -> thumbnail_url will be empty
    #  Ready  = preview available -> thumbnail_url will point to preview image
    #  Failed = preview generation failed -> thumbnail_url is empty
    #        in which case `preview_error` will contain error why preview
    #        generation failed
    preview_status: Mapped[str] = mapped_column(
        Enum(ImagePreviewStatus, name="preview_status"), nullable=True
    )
    # `preview_error`
    # only for troubleshooting purposes. Relevant only in case
    # `preview_status` = Failed
    preview_error: Mapped[str] = mapped_column(nullable=True)
    document_type: Mapped[DocumentType] = relationship(  # noqa: F821
        primaryjoin="DocumentType.id == Document.document_type_id"
    )
    document_type_id: Mapped[UUID] = mapped_column(
        ForeignKey("document_types.id", name="documents_document_type_id_fkey", ondelete="SET NULL"), nullable=True
    )
    versions: Mapped[list["DocumentVersion"]] = relationship(
        back_populates="document", lazy="selectin"
    )

    __mapper_args__ = {
        "polymorphic_identity": "document",
    }

    @property
    def is_processing(self) -> bool:
        """Check if document is currently being processed"""
        return self.processing_status in [
            DocumentProcessingStatus.converting,
            DocumentProcessingStatus.processing_pages
        ]

    @property
    def is_ready(self) -> bool:
        """Check if document is ready for use"""
        return self.processing_status == DocumentProcessingStatus.ready

    @property
    def has_failed(self) -> bool:
        """Check if document processing failed"""
        return self.processing_status == DocumentProcessingStatus.failed


class DocumentVersion(Base, AuditColumns):
    __tablename__ = "document_versions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    number: Mapped[int] = mapped_column(default=1)
    file_name: Mapped[str] = mapped_column(nullable=True)
    size: Mapped[int] = mapped_column(default=0)
    mime_type: Mapped[str] = mapped_column(nullable=False)
    checksum: Mapped[str] = mapped_column(nullable=True)
    checksum_algorithm: Mapped[str] = mapped_column(nullable=True)
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("documents.node_id", ondelete="CASCADE")
    )
    document: Mapped[Document] = relationship(back_populates="versions")
    lang: Mapped[str] = mapped_column(default="deu")
    text: Mapped[str] = mapped_column(nullable=True)

    page_count: Mapped[int] = mapped_column(default=0)
    short_description: Mapped[str] = mapped_column(nullable=True)

    # Version lineage tracking
    is_original: Mapped[bool] = mapped_column(default=False)
    source_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("document_versions.id", ondelete="SET NULL"),
        nullable=True
    )
    creation_reason: Mapped[str] = mapped_column(
        default="upload",
        nullable=False
    )
    # Possible values: "upload", "conversion", "page_edit", "merge"

    pages: Mapped[list["Page"]] = relationship(
        back_populates="document_version", lazy="select"
    )

    @property
    def file_path(self) -> Path:
        return abs_docver_path(self.id, self.file_name)

    def __repr__(self):
        return f"DocumentVersion(id={self.id}, number={self.number})"


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    number: Mapped[int]
    page_count: Mapped[int]
    lang: Mapped[str] = mapped_column(default="deu")
    text: Mapped[str] = mapped_column(nullable=True)
    document_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("document_versions.id", ondelete="CASCADE")
    )
    document_version: Mapped[DocumentVersion] = relationship(back_populates="pages")
    def __repr__(self):
        return f"Page(id={self.id}, number={self.number})"
