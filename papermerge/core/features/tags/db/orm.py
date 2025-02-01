import uuid
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from papermerge.core.db.base import Base


class NodeTagsAssociation(Base):
    __tablename__ = "nodes_tags"
    id: Mapped[int] = mapped_column(primary_key=True)
    node_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("nodes.id", ondelete="CASCADE")
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tags.id", ondelete="CASCADE"),
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    fg_color: Mapped[str] = mapped_column(nullable=True, default="#FFFFF")
    bg_color: Mapped[str] = mapped_column(nullable=True, default="#c41fff")
    pinned: Mapped[bool] = mapped_column(default=False)
    description: Mapped[str] = mapped_column(nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", use_alter=True, name="tag_user_id_fk")
    )

    __table_args__ = (
        UniqueConstraint("name", "user_id", name="unique tag name per user"),
    )

    def __repr__(self):
        return f"Tag(name={self.name})"
