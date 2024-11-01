import uuid
from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.base import Base


class NodeTagsAssociation(Base):
    __tablename__ = "nodes_tags"
    id: Mapped[int] = mapped_column(primary_key=True)
    node_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("core_basetreenode.id"))
    tag_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tags.id"),
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    fg_color: Mapped[str] = mapped_column(nullable=True)
    bg_color: Mapped[str] = mapped_column(nullable=True)
    pinned: Mapped[bool] = mapped_column(default=False)
    description: Mapped[str] = mapped_column(nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("core_user.id", use_alter=True, name="tag_user_id_fk")
    )
