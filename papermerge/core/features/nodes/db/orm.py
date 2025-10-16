import uuid
from uuid import UUID

from sqlalchemy import ForeignKey, String, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.features.ownership.db.orm import OwnedResourceMixin
from papermerge.core.db.base import Base
from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.types import CType


class Node(Base, AuditColumns, OwnedResourceMixin):
    __tablename__ = "nodes"

    id: Mapped[UUID] = mapped_column(primary_key=True, insert_default=uuid.uuid4())
    title: Mapped[str] = mapped_column(String(200))
    ctype: Mapped[CType]
    lang: Mapped[str] = mapped_column(String(8), default="deu")

    parent_id: Mapped[UUID] = mapped_column(ForeignKey("nodes.id"), nullable=True)
    tags: Mapped[list["Tag"]] = relationship(secondary="nodes_tags", lazy="selectin")

    __mapper_args__ = {
        "polymorphic_identity": "node",
        "polymorphic_on": "ctype",
        "confirm_deleted_rows": False,
    }

    __table_args__ = (
        # Partial unique index: only folders with same title under same parent are prevented
        # This uses a partial index with a WHERE clause to only apply to folders
        Index(
            'idx_nodes_unique_folder_title_parent',
            'title',
            'parent_id',
            unique=True,
            postgresql_where=text("ctype = 'folder'")
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
