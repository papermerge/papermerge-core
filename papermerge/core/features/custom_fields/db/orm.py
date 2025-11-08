# papermerge/core/features/custom_fields/db/orm.py

from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    ForeignKey, Index,
    String, Text, Numeric, Date, DateTime, Boolean
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.schema import Computed

from papermerge.core.features.ownership.db.orm import OwnedResourceMixin
from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.utils.tz import utc_now
from papermerge.core.db.base import Base


class CustomField(Base, AuditColumns, OwnedResourceMixin):
    """Custom field definition"""
    __tablename__ = "custom_fields"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    type_handler: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    config: Mapped[dict] = mapped_column(JSONB, nullable=True, server_default='{}')

    __table_args__ = (
        Index('idx_custom_fields_type', 'type_handler'),
        Index('idx_custom_fields_name', 'name'),
    )

    def __repr__(self):
        return f"CustomField(name={self.name}, type_handler={self.type_handler})"


class CustomFieldValue(Base):
    """Custom field values for documents"""
    __tablename__ = "custom_field_values"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    document_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("documents.node_id", ondelete="CASCADE"),
        nullable=False
    )
    field_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("custom_fields.id", ondelete="CASCADE"),
        nullable=False
    )

    # Primary storage: JSONB
    value: Mapped[dict] = mapped_column(JSONB, nullable=False)

    value_text: Mapped[str | None] = mapped_column(
        Text,
        Computed("(value->>'sortable')"),
        nullable=True
    )

    value_numeric: Mapped[Decimal | None] = mapped_column(
        Numeric(20, 6),
        Computed("""
            CASE
                WHEN jsonb_typeof(value->'raw') = 'number'
                THEN (value->>'raw')::NUMERIC
                ELSE NULL
            END
        """),
        nullable=True
    )

    value_date: Mapped[date | None] = mapped_column(
        Date,
        Computed("jsonb_text_to_date(value->'raw')"),
        nullable=True
    )

    value_datetime: Mapped[datetime | None] = mapped_column(
        DateTime,
        Computed("jsonb_text_to_timestamp(value->'raw')"),
        nullable=True
    )

    value_boolean: Mapped[bool | None] = mapped_column(
        Boolean,
        Computed("""
            CASE
                WHEN jsonb_typeof(value->'raw') = 'boolean'
                THEN (value->>'raw')::BOOLEAN
                ELSE NULL
            END
        """),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default="now()",
        nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        onupdate=utc_now,
        nullable=True
    )

    __table_args__ = (
        Index('idx_cfv_unique_doc_field', 'document_id', 'field_id', unique=True),
        Index('idx_cfv_doc', 'document_id'),
        Index('idx_cfv_field_text', 'field_id', 'value_text'),
        Index('idx_cfv_field_numeric', 'field_id', 'value_numeric'),
        Index('idx_cfv_field_date', 'field_id', 'value_date'),
        Index('idx_cfv_field_datetime', 'field_id', 'value_datetime'),
        Index('idx_cfv_field_boolean', 'field_id', 'value_boolean'),
    )

    def __repr__(self):
        return f"CustomFieldValue(id={self.id}, document={self.document_id}, field={self.field_id})"
