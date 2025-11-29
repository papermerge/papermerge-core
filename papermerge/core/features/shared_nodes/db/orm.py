import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, func, CheckConstraint, Index, text
from sqlalchemy.orm import Mapped, mapped_column

from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.db.base import Base


class SharedNode(Base, AuditColumns):
    __tablename__ = "shared_nodes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    node_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "nodes.id",
            use_alter=True,
            name="shared_nodes_node_id_fkey",
            # when node is deleted, the access to shared node is revoked
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "users.id",
            use_alter=True,
            name="shared_nodes_user_id_fkey",
            # when user is deleted, the access to shared node is revoked
            ondelete="CASCADE",
        ),
        nullable=True,
    )
    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "groups.id",
            use_alter=True,
            name="shared_nodes_group_id_fkey",
            # when group is deleted, the access to shared node is revoked
            ondelete="CASCADE",
        ),
        nullable=True,
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "roles.id",
            use_alter=True,
            name="shared_nodes_role_id_fkey",
            # when role is deleted, the access to shared node is revoked
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "users.id",
            use_alter=True,
            name="shared_nodes_owner_id_fkey",
            # when owner is deleted, the access to shared node is revoked
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        # Exactly one of user_id or group_id must be set (XOR)
        CheckConstraint(
            "(user_id IS NOT NULL AND group_id IS NULL) OR "
            "(user_id IS NULL AND group_id IS NOT NULL)",
            name="check__user_id_xor_group_id",
        ),
        # Unique constraint for user shares
        Index(
            "idx_shared_nodes_user_unique",
            "node_id", "user_id", "role_id",
            unique=True,
            postgresql_where=text("user_id IS NOT NULL"),
        ),
        # Unique constraint for group shares
        Index(
            "idx_shared_nodes_group_unique",
            "node_id", "group_id", "role_id",
            unique=True,
            postgresql_where=text("group_id IS NOT NULL"),
        ),
        # Performance indexes
        Index(
            "idx_shared_nodes_user_id",
            "user_id",
            postgresql_where=text("user_id IS NOT NULL"),
        ),
        Index(
            "idx_shared_nodes_group_id",
            "group_id",
            postgresql_where=text("group_id IS NOT NULL"),
        ),
        Index("idx_shared_nodes_node_id", "node_id"),
        Index("idx_shared_nodes_owner_id", "owner_id"),
    )

    def __repr__(self):
        return f"SharedNode(id={self.id}, node_id={self.node_id})"
