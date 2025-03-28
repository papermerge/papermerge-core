from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, func, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base


class DocumentTypeCustomField(Base):
    __tablename__ = "document_types_custom_fields"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_type_id: Mapped[UUID] = mapped_column(ForeignKey("document_types.id"))

    custom_field_id: Mapped[UUID] = mapped_column(
        ForeignKey("custom_fields.id"),
    )


class DocumentType(Base):
    __tablename__ = "document_types"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str]
    path_template: Mapped[str] = mapped_column(nullable=True)
    custom_fields: Mapped[list["CustomField"]] = relationship(  #  noqa: F821
        secondary="document_types_custom_fields"
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=True)
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())

    __table_args__ = (
        UniqueConstraint("name", "user_id", name="unique document type per user"),
        UniqueConstraint("name", "group_id", name="unique document type per group"),
        CheckConstraint(
            "user_id IS NOT NULL OR group_id IS NOT NULL",
            name="check__user_id_not_null__or__group_id_not_null",
        ),
    )
