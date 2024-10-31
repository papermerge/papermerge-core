from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base

user_permissions_association = Table(
    "core_user_user_permissions",
    Base.metadata,
    Column(
        "user_id",
        ForeignKey("core_user.id"),
    ),
    Column(
        "permission_id",
        ForeignKey("auth_permission.id"),
    ),
)

group_permissions_association = Table(
    "auth_group_permissions",
    Base.metadata,
    Column(
        "group_id",
        ForeignKey("auth_group.id"),
    ),
    Column(
        "permission_id",
        ForeignKey("auth_permission.id"),
    ),
)


user_groups_association = Table(
    "core_user_groups",
    Base.metadata,
    Column(
        "user_id",
        ForeignKey("core_user.id"),
    ),
    Column(
        "group_id",
        ForeignKey("auth_group.id"),
    ),
)


class Permission(Base):
    __tablename__ = "auth_permission"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    codename: Mapped[str]
    content_type_id: Mapped[int] = mapped_column(ForeignKey("django_content_type.id"))
    content_type: Mapped["ContentType"] = relationship()  # noqa: F821
    groups = relationship(
        "Group", secondary=group_permissions_association, back_populates="permissions"
    )
    users = relationship(
        "User", secondary=user_permissions_association, back_populates="permissions"
    )


class Group(Base):
    __tablename__ = "auth_group"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    permissions: Mapped[list["Permission"]] = relationship(
        secondary=group_permissions_association, back_populates="groups"
    )
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        secondary=user_groups_association, back_populates="groups"
    )
