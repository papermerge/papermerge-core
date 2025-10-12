"""
ORM model for special folders (home, inbox, and future folder types).

This table serves as a junction between users/groups and their special folders
"""

import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID, TIMESTAMP
from sqlalchemy import Enum as SQLEnum

from papermerge.core.db.base import Base
from papermerge.core.types import OwnerType, FolderType


class SpecialFolder(Base):
    """
    Junction table linking users/groups to their special folders.

    Design benefits:
    - No circular dependencies
    - No deferrable constraints needed
    - Easily extensible for new folder types
    - Can query "all special folders for user X"
    - Can add metadata (is_pinned, sort_order, icon) without changing user/group tables

    Example usage:
        # Get user's home folder
        sf = session.query(SpecialFolder).filter(
            SpecialFolder.owner_type == OwnerType.USER,
            SpecialFolder.owner_id == user.id,
            SpecialFolder.folder_type == FolderType.HOME
        ).first()

        home_folder_id = sf.folder_id
    """
    __tablename__ = "special_folders"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Polymorphic owner (user or group)
    owner_type: Mapped[OwnerType] = mapped_column(
        SQLEnum(
            OwnerType,
            name="owner_type_enum",
            values_callable=lambda x: [e.value for e in x],
            create_type=False
        ),
        nullable=False,
        index=True,
        comment="Type of owner: 'user' or 'group'"
    )

    owner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="UUID of the user or group that owns this special folder"
    )

    # Type of special folder
    folder_type: Mapped[FolderType] = mapped_column(
        SQLEnum(
            FolderType,
            name="folder_type_enum",
            values_callable=lambda x: [e.value for e in x],
            create_type=False
        ),
        nullable=False,
        comment="Type of special folder: 'home', 'inbox', etc."
    )

    # Reference to the actual folder node
    folder_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("folders.node_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Reference to the actual folder in the nodes/folders table"
    )

    # Relationship to the folder
    # Note: We use foreign_keys and don't set back_populates
    # because Folder doesn't need to know about SpecialFolder
    folder: Mapped["Folder"] = relationship(
        "Folder",
        foreign_keys=[folder_id],
        lazy="joined",  # Eager load by default for convenience
        viewonly=True   # One-directional relationship
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    __table_args__ = (
        # Each owner can have only ONE folder of each type
        # e.g., a user can have only one HOME folder, one INBOX folder, etc.
        UniqueConstraint(
            'owner_type',
            'owner_id',
            'folder_type',
            name='uq_special_folder_per_owner'
        ),

        # Composite index for efficient lookups by owner
        Index(
            'idx_special_folders_owner',
            'owner_type',
            'owner_id'
        ),

        # Index for reverse lookups (find owner of a folder)
        Index(
            'idx_special_folders_folder_id',
            'folder_id'
        ),
    )

    def __repr__(self):
        return (
            f"SpecialFolder("
            f"owner={self.owner_type.value}:{self.owner_id}, "
            f"type={self.folder_type.value}, "
            f"folder_id={self.folder_id})"
        )

    def __str__(self):
        return f"{self.owner_type.value}'s {self.folder_type.value} folder"
