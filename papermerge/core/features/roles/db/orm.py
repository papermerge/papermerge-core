import uuid

from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base


roles_permissions_association = Table(
    "roles_permissions",
    Base.metadata,
    Column(
        "role_id",
        ForeignKey("role.id"),
    ),
    Column(
        "permission_id",
        ForeignKey("permissions.id"),
    ),
)


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    codename: Mapped[str]
    roles = relationship(
        "Role", secondary=roles_permissions_association, back_populates="permissions"
    )


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    permissions: Mapped[list["Permission"]] = relationship(
        secondary=roles_permissions_association, back_populates="roles"
    )
