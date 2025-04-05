import uuid

from sqlalchemy import ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from papermerge.core.features.users.db.orm import User
from papermerge.core.db.base import Base


class SharedNode(Base):
    __tablename__ = "shared_nodes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    node_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "nodes.id",
            use_alter=True,
            name="shared_nodes_node_id_fkey",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "users.id",
            use_alter=True,
            name="shared_nodes_user_id_fkey",
            ondelete="CASCADE",
        ),
        nullable=True,
    )
    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "groups.id",
            use_alter=True,
            name="shared_nodes_group_id_fkey",
            ondelete="CASCADE",
        ),
        nullable=True,
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "roles.id",
            use_alter=True,
            name="shared_nodes_role_id_fkey",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "users.id",
            use_alter=True,
            name="shared_nodes_owner_id_fkey",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "user_id IS NOT NULL OR group_id IS NOT NULL",
            name="check__user_id_not_null__or__group_id_not_null",
        ),
    )

    def __repr__(self):
        return f"SharedNode(id={self.id}, node_id={self.node_id})"
