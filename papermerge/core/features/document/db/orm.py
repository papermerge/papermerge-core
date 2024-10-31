from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.nodes import Node


class Document(Node):
    __tablename__ = "core_document"

    id: Mapped[UUID] = mapped_column(
        "basetreenode_ptr_id", ForeignKey("core_basetreenode.id"), primary_key=True
    )

    ocr: Mapped[bool] = mapped_column(default=False)
    ocr_status: Mapped[str] = mapped_column(default="UNKNOWN")
    document_type: Mapped["DocumentType"] = relationship(  # noqa: F821
        primaryjoin="DocumentType.id == Document.document_type_id"
    )
    document_type_id: Mapped[UUID] = mapped_column(
        ForeignKey("document_types.id"), nullable=True
    )

    __mapper_args__ = {
        "polymorphic_identity": "document",
    }
