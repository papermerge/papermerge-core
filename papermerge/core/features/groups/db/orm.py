import uuid

from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base

user_permissions_association = Table(
    "users_permissions",
    Base.metadata,
    Column(
        "user_id",
        ForeignKey("users.id"),
    ),
    Column(
        "permission_id",
        ForeignKey("permissions.id"),
    ),
)

group_permissions_association = Table(
    "groups_permissions",
    Base.metadata,
    Column(
        "group_id",
        ForeignKey("groups.id"),
    ),
    Column(
        "permission_id",
        ForeignKey("permissions.id"),
    ),
)


user_groups_association = Table(
    "users_groups",
    Base.metadata,
    Column(
        "user_id",
        ForeignKey("users.id"),
    ),
    Column(
        "group_id",
        ForeignKey("groups.id"),
    ),
)


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    codename: Mapped[str]
    groups = relationship(
        "Group", secondary=group_permissions_association, back_populates="permissions"
    )
    users = relationship(
        "User", secondary=user_permissions_association, back_populates="permissions"
    )


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    permissions: Mapped[list["Permission"]] = relationship(
        secondary=group_permissions_association, back_populates="groups"
    )
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        secondary=user_groups_association, back_populates="groups"
    )
