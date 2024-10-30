from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from papermerge.core.db.base import Base


class CustomField(Base):
    __tablename__ = "custom_fields"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str]
    type: Mapped[str]
    extra_data: Mapped[str] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())
    user_id: Mapped[UUID] = mapped_column(ForeignKey("core_user.id"))


class CustomFieldValue(Base):
    __tablename__ = "custom_field_values"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("core_document.basetreenode_ptr_id")
    )
    field_id: Mapped[UUID] = mapped_column(ForeignKey("custom_fields.id"))
    value_text: Mapped[str] = mapped_column(nullable=True)
    value_boolean: Mapped[bool] = mapped_column(nullable=True)
    value_date: Mapped[datetime] = mapped_column(nullable=True)
    value_int: Mapped[int] = mapped_column(nullable=True)
    value_float: Mapped[float] = mapped_column(nullable=True)
    value_monetary: Mapped[str] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())

    def __repr__(self):
        return f"CustomFieldValue(ID={self.id})"
