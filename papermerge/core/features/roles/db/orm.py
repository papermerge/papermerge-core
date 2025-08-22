import uuid

from sqlalchemy import Column, ForeignKey, Table
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

users_roles_association = Table(
    "users_roles",
    Base.metadata,
    Column(
        "role_id",
        ForeignKey("roles.id"),
    ),
    Column(
        "user_id",
        ForeignKey("users.id"),
    ),
)


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
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    permissions: Mapped[list["Permission"]] = relationship(
        secondary=roles_permissions_association, back_populates="roles"
    )
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        secondary=users_roles_association, back_populates="roles"
    )

    __table_args__ = (
        CheckConstraint("char_length(trim(name)) > 0", name="role_name_not_empty"),
    )
