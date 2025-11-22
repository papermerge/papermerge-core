from uuid import UUID as PyUUID
from datetime import datetime

from sqlalchemy import Text, CheckConstraint, Boolean, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from papermerge.core.utils.tz import utc_now
from papermerge.core.db.base import Base


class SystemPreferences(Base):
    __tablename__ = "system_preferences"
    __table_args__ = (
        CheckConstraint('singleton = true', name='singleton_check'),
    )

    singleton: Mapped[bool] = mapped_column(
        Boolean,
        primary_key=True,
        default=True,
        server_default='true'
    )
    preferences: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,  # Use dict instead of {} for default
        server_default='{}'
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=utc_now,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=utc_now,
        onupdate=func.now(),
        nullable=False
    )
    updated_by: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    preferences: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,  # Use dict instead of {} for default
        server_default='{}'
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=utc_now,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=utc_now,
        onupdate=func.now(),
        nullable=False
    )

    def __repr__(self):
        return f"UserPreferences(preferences={self.preferences})"
