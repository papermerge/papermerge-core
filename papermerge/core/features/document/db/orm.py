import uuid
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base
from papermerge.core.features.document_types.db.orm import DocumentType
from papermerge.core.features.nodes.db.orm import Node
from papermerge.core.types import OCRStatusEnum


class Document(Node):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
        "node_id",
        ForeignKey("nodes.id"),
        primary_key=True,
        default=uuid.uuid4,
    )

    ocr: Mapped[bool] = mapped_column(default=False)
    ocr_status: Mapped[str] = mapped_column(default=OCRStatusEnum.unknown)
    document_type: Mapped[DocumentType] = relationship(  # noqa: F821
        primaryjoin="DocumentType.id == Document.document_type_id"
    )
    document_type_id: Mapped[UUID] = mapped_column(
        ForeignKey("document_types.id"), nullable=True
    )
    versions: Mapped[list["DocumentVersion"]] = relationship(back_populates="document")

    __mapper_args__ = {
        "polymorphic_identity": "document",
    }


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    number: Mapped[int] = mapped_column(default=1)
    file_name: Mapped[str] = mapped_column(nullable=True)
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.node_id"))
    document: Mapped[Document] = relationship(back_populates="versions")
    lang: Mapped[str] = mapped_column(default="deu")
    text: Mapped[str] = mapped_column(nullable=True)
    size: Mapped[int] = mapped_column(default=0)
    page_count: Mapped[int] = mapped_column(default=0)
    short_description: Mapped[str] = mapped_column(nullable=True)
    pages: Mapped[list["Page"]] = relationship(back_populates="document_version")

    def __repr__(self):
        return f"DocumentVersion(number={self.number})"


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    number: Mapped[int]
    lang: Mapped[str] = mapped_column(default="deu")
    text: Mapped[str] = mapped_column(nullable=True)
    document_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("document_versions.id")
    )
    document_version: Mapped[DocumentVersion] = relationship(back_populates="pages")