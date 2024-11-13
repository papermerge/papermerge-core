import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, String, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.features.users.db.orm import User
from papermerge.core.db.base import Base
from papermerge.core.types import CType


class Node(Base):
    __tablename__ = "nodes"

    id: Mapped[UUID] = mapped_column(primary_key=True, insert_default=uuid.uuid4())
    title: Mapped[str] = mapped_column(String(200))
    ctype: Mapped[CType]
    lang: Mapped[str] = mapped_column(String(8), default="deu")
    user: Mapped["User"] = relationship(
        back_populates="nodes",
        primaryjoin="User.id == Node.user_id",
        remote_side=User.id,
        cascade="delete",
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "users.id", use_alter=True, name="nodes_user_id_fkey", ondelete="CASCADE"
        )
    )
    parent_id: Mapped[UUID] = mapped_column(ForeignKey("nodes.id"), nullable=True)
    tags: Mapped[list["Tag"]] = relationship(secondary="nodes_tags", lazy="selectin")
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(), onupdate=func.now()
    )

    __mapper_args__ = {
        "polymorphic_identity": "node",
        "polymorphic_on": "ctype",
        "confirm_deleted_rows": False,
    }

    __table_args__ = (
        UniqueConstraint(
            "parent_id", "title", "user_id", name="unique title per parent per user"
        ),
    )

    def __repr__(self):
        return f"{self.__class__.__name__}({self.title!r})"


class Folder(Node):
    __tablename__ = "folders"

    id: Mapped[UUID] = mapped_column(
        "node_id",
        ForeignKey("nodes.id", ondelete="CASCADE"),
        primary_key=True,
        insert_default=uuid.uuid4,
    )

    __mapper_args__ = {
        "polymorphic_identity": "folder",
    }
