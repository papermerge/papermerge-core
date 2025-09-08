import uuid

from sqlalchemy import Column, ForeignKey, Table, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import CheckConstraint

from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.db.base import Base

roles_permissions_association = Table(
    "roles_permissions",
    Base.metadata,
    Column(
        "role_id",
        ForeignKey("roles.id"),
    ),
    Column(
        "permission_id",
        ForeignKey("permissions.id"),
    ),
)

class UserRole(Base, AuditColumns):
    __tablename__ = "users_roles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    # Relationships
    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="user_roles",
        foreign_keys=[role_id]
    )
    user: Mapped["User"] = relationship(
        "User",
        back_populates="user_roles",
        foreign_keys=[user_id]
    )

    def __repr__(self):
        return f"UserRole({self.id=}, {self.role=}, {self.user=})"


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(unique=True)
    codename: Mapped[str] = mapped_column(unique=True)
    roles = relationship(
        "Role", secondary=roles_permissions_association, back_populates="permissions"
    )

    def __repr__(self):
        return f"Permission({self.name=}, {self.codename=})"


class Role(Base, AuditColumns):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(nullable=False)
    permissions: Mapped[list["Permission"]] = relationship(
        secondary=roles_permissions_association, back_populates="roles"
    )

    user_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole", back_populates="role"
    )

    # Convenience property to get active users
    @property
    def active_users(self):
        return [ur.user for ur in self.user_roles if ur.deleted_at is None]

    def __repr__(self):
        return f"Role({self.id=}, {self.name=})"

    __table_args__ = (
        CheckConstraint("char_length(trim(name)) > 0", name="role_name_not_empty"),
        # partially unique index: unique only for records where `deleted_at IS NULL`
        Index(
            'idx_roles_name_active_unique',
            'name',
            unique=True,
            postgresql_where=text('deleted_at IS NULL')
        ),
    )
