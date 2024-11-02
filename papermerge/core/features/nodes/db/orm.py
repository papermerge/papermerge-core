import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, String, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.features.users.db.orm import User
from papermerge.core.db.base import Base
from papermerge.core.types import CType


class Node(Base):
    __tablename__ = "core_basetreenode"

    id: Mapped[UUID] = mapped_column(primary_key=True, insert_default=uuid.uuid4())
    title: Mapped[str] = mapped_column(String(200))
    ctype: Mapped[CType]
    lang: Mapped[str] = mapped_column(String(8), default="de")
    user: Mapped["User"] = relationship(
        back_populates="nodes",
        primaryjoin="User.id == Node.user_id",
        remote_side=User.id,
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "core_user.id", use_alter=True, name="core_basetreenode_user_id_fkey"
        )
    )
    parent_id: Mapped[UUID] = mapped_column(
        ForeignKey("core_basetreenode.id"), nullable=True
    )
    tags: Mapped[list["Tag"]] = relationship(secondary="nodes_tags", lazy="selectin")
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(), onupdate=func.now()
    )

    __mapper_args__ = {
        "polymorphic_identity": "node",
        "polymorphic_on": "ctype",
    }

    __table_args__ = (
        UniqueConstraint(
            "parent_id", "title", "user_id", name="unique title per parent per user"
        ),
    )

    def __repr__(self):
        return f"{self.__class__.__name__}({self.title!r})"


class Folder(Node):
    __tablename__ = "core_folder"

    id: Mapped[UUID] = mapped_column(
        "basetreenode_ptr_id",
        ForeignKey("core_basetreenode.id"),
        primary_key=True,
        insert_default=uuid.uuid4(),
    )

    __mapper_args__ = {
        "polymorphic_identity": "folder",
    }
