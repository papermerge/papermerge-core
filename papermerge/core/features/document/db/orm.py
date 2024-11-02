import uuid
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base
from papermerge.core.features.nodes.db.orm import Node
from papermerge.core.types import OCRStatusEnum


class Document(Node):
    __tablename__ = "core_document"

    id: Mapped[UUID] = mapped_column(
        "basetreenode_ptr_id",
        ForeignKey("core_basetreenode.id"),
        primary_key=True,
        default=uuid.uuid4,
    )

    ocr: Mapped[bool] = mapped_column(default=False)
    ocr_status: Mapped[str] = mapped_column(default=OCRStatusEnum.unknown)
    document_type: Mapped["DocumentType"] = relationship(  # noqa: F821
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
    __tablename__ = "core_documentversion"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    number: Mapped[int] = mapped_column(default=1)
    file_name: Mapped[str] = mapped_column(nullable=True)
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("core_document.basetreenode_ptr_id")
    )
    document: Mapped[Document] = relationship(back_populates="versions")
    lang: Mapped[str] = mapped_column(default="deu")
    size: Mapped[int] = mapped_column(default=0)
    page_count: Mapped[int] = mapped_column(default=0)
    short_description: Mapped[str] = mapped_column(nullable=True)

    def __repr__(self):
        return f"DocumentVersion(number={self.number})"


class Page(Base):
    __tablename__ = "core_page"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    number: Mapped[int]
    lang: Mapped[str]
    text: Mapped[str]
    document_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("core_documentversion.id")
    )
