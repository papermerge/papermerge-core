import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, func, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.db.base import Base
from papermerge.core import constants as const


class User(Base, AuditColumns):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, insert_default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(const.USERNAME_MAX_LENGTH), unique=True)
    email: Mapped[str] = mapped_column(String(const.EMAIL_MAX_LENGTH), unique=True)
    password: Mapped[str] = mapped_column(String(const.PASSWORD_MAX_LENGTH), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(const.NAME_MAX_LENGTH), default=None)
    last_name: Mapped[str | None] = mapped_column(String(const.NAME_MAX_LENGTH), default=None)
    is_superuser: Mapped[bool] = mapped_column(default=False)
    is_staff: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=False)
    nodes: Mapped[list["Node"]] = relationship(
        back_populates="user", primaryjoin="User.id == Node.user_id", cascade="delete"
    )
    home_folder_id: Mapped[UUID] = mapped_column(
        ForeignKey("folders.node_id", deferrable=True, ondelete="CASCADE"),
        nullable=False,
    )
    home_folder: Mapped["Folder"] = relationship(
        primaryjoin="User.home_folder_id == Folder.id",
        back_populates="user",
        viewonly=True,
        cascade="delete",
    )
    inbox_folder_id: Mapped[UUID] = mapped_column(
        ForeignKey("folders.node_id", deferrable=True, ondelete="CASCADE"),
        nullable=False,
    )
    inbox_folder: Mapped["Folder"] = relationship(
        primaryjoin="User.inbox_folder_id == Folder.id",
        back_populates="user",
        viewonly=True,
        cascade="delete",
    )
    date_joined: Mapped[datetime] = mapped_column(insert_default=func.now())

    user_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="user",
        foreign_keys="UserRole.user_id"
    )

    user_groups: Mapped[list["UserGroup"]] = relationship(
        "UserGroup",
        back_populates="user",
        foreign_keys="UserGroup.user_id"
    )

    # Convenience property to get active roles
    @property
    def active_roles(self):
        return [ur.role for ur in self.user_roles if ur.deleted_at is None]

    # Convenience property to get active groups
    @property
    def active_groups(self):
        return [ug.group for ug in self.user_groups if ug.deleted_at is None]

    def __repr__(self):
        return f"User({self.id=}, {self.username=})"

    __mapper_args__ = {"confirm_deleted_rows": False}
