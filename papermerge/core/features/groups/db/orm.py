import uuid

from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base


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


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(unique=True)
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        secondary=user_groups_association, back_populates="groups"
    )
