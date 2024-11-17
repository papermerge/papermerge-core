import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base
from papermerge.core.features.groups.db.orm import (
    user_groups_association,
    user_permissions_association,
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, insert_default=uuid.uuid4())
    username: Mapped[str] = mapped_column(unique=True)
    email: Mapped[str] = mapped_column(unique=True)
    password: Mapped[str] = mapped_column(nullable=False)
    first_name: Mapped[str] = mapped_column(default=" ")
    last_name: Mapped[str] = mapped_column(default=" ")
    is_superuser: Mapped[bool] = mapped_column(default=False)
    is_staff: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=False)
    nodes: Mapped[list["Node"]] = relationship(
        back_populates="user", primaryjoin="User.id == Node.user_id", cascade="delete"
    )
    home_folder_id: Mapped[UUID] = mapped_column(
        ForeignKey("folders.node_id", deferrable=True, ondelete="CASCADE"),
        nullable=True,
    )
    home_folder: Mapped["Folder"] = relationship(
        primaryjoin="User.home_folder_id == Folder.id",
        back_populates="user",
        viewonly=True,
        cascade="delete",
    )
    inbox_folder_id: Mapped[UUID] = mapped_column(
        ForeignKey("folders.node_id", deferrable=True, ondelete="CASCADE"),
        nullable=True,
    )
    inbox_folder: Mapped["Folder"] = relationship(
        primaryjoin="User.inbox_folder_id == Folder.id",
        back_populates="user",
        viewonly=True,
        cascade="delete",
    )
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())
    date_joined: Mapped[datetime] = mapped_column(insert_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(), onupdate=func.now()
    )
    permissions: Mapped[list["Permission"]] = relationship(  # noqa: F821
        secondary=user_permissions_association, back_populates="users"
    )
    groups: Mapped[list["Group"]] = relationship(  # noqa: F821
        secondary=user_groups_association, back_populates="users"
    )

    __mapper_args__ = {"confirm_deleted_rows": False}
