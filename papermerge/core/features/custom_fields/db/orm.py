from datetime import datetime
from uuid import UUID
from decimal import Decimal

from sqlalchemy import ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.db.base import Base


class CustomField(Base, AuditColumns):
    __tablename__ = "custom_fields"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    type: Mapped[str]
    extra_data: Mapped[str] = mapped_column(nullable=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", name="custom_fields_user_id_fkey"), nullable=True
    )
    group_id: Mapped[UUID] = mapped_column(
        ForeignKey("groups.id", name="custom_fields_group_id_fkey"), nullable=True
    )

    __table_args__ = (
        CheckConstraint(
            "user_id IS NOT NULL OR group_id IS NOT NULL",
            name="check__user_id_not_null__or__group_id_not_null",
        ),
    )


class CustomFieldValue(Base):
    __tablename__ = "custom_field_values"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("documents.node_id", ondelete="CASCADE")
    )
    field_id: Mapped[UUID] = mapped_column(ForeignKey("custom_fields.id"))
    value_text: Mapped[str] = mapped_column(nullable=True)
    value_boolean: Mapped[bool] = mapped_column(nullable=True)
    value_date: Mapped[datetime] = mapped_column(nullable=True)
    value_int: Mapped[int] = mapped_column(nullable=True)
    value_float: Mapped[float] = mapped_column(nullable=True)
    value_monetary: Mapped[Decimal] = mapped_column(nullable=True)
    value_yearmonth: Mapped[float] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())

    def __repr__(self):
        return f"CustomFieldValue(ID={self.id})"
