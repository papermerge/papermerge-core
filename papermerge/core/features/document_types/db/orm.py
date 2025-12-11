from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.features.ownership.db.orm import OwnedResourceMixin
from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.db.base import Base


class DocumentTypeCustomField(Base):
    __tablename__ = "document_types_custom_fields"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_type_id: Mapped[UUID] = mapped_column(ForeignKey("document_types.id"))

    custom_field_id: Mapped[UUID] = mapped_column(
        ForeignKey("custom_fields.id"),
    )
    position: Mapped[int] = mapped_column(default=0)  # NEW


class DocumentType(Base, AuditColumns, OwnedResourceMixin):
    __tablename__ = "document_types"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str]
    path_template: Mapped[str] = mapped_column(nullable=True)
    custom_fields: Mapped[list["CustomField"]] = relationship(  #  noqa: F821
        secondary="document_types_custom_fields",
        order_by="DocumentTypeCustomField.position"
    )
