from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class DocumentTypeCustomField(Base):
    __tablename__ = "document_type_custom_field"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_type_id: Mapped[UUID] = mapped_column(ForeignKey("document_types.id"))

    custom_field_id: Mapped[UUID] = mapped_column(
        ForeignKey("custom_fields.id"),
    )


class ContentType(Base):
    __tablename__ = "django_content_type"

    id: Mapped[int] = mapped_column(primary_key=True)
    app_label: Mapped[str]
    model: Mapped[str]
