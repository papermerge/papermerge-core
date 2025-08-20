from uuid import UUID
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import TIMESTAMP


class AuditColumns:
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    deleted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )
    archived_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )
    created_by: Mapped[UUID] = mapped_column(nullable=True)
    updated_by: Mapped[UUID] = mapped_column(nullable=True)
    deleted_by: Mapped[UUID] = mapped_column(nullable=True)
    archived_by: Mapped[UUID] = mapped_column(nullable=True)
