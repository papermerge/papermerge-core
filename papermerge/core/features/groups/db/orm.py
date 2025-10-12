import uuid
from uuid import UUID

from sqlalchemy import CheckConstraint, Index, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.db.base import Base


class UserGroup(Base, AuditColumns):
    """Association table between users and groups"""
    __tablename__ = "users_groups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("groups.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    # Relationships
    group: Mapped["Group"] = relationship(
        "Group",
        back_populates="user_groups",
        foreign_keys=[group_id]
    )
    user: Mapped["User"] = relationship(
        "User",
        back_populates="user_groups",
        foreign_keys=[user_id]
    )

    def __repr__(self):
        return f"UserGroup({self.id=}, {self.group=}, {self.user=})"


class Group(Base, AuditColumns):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(nullable=False)

    # Flag for async deletion of entire group
    # Entire group is marked for deletion.
    # Groups deletion is done async as groups may have
    # associated documents and folders
    delete_me: Mapped[bool] = mapped_column(default=False, nullable=True)

    special_folders: Mapped[list["SpecialFolder"]] = relationship(
        "SpecialFolder",
        primaryjoin=(
            "and_("
            "foreign(SpecialFolder.owner_id) == Group.id, "
            "SpecialFolder.owner_type == 'group'"
            ")"
        ),
        viewonly=True,
        lazy="selectin",  # Eager load special folders with group
        cascade="delete"  # Delete special folders when group is deleted
    )

    user_groups: Mapped[list["UserGroup"]] = relationship(
        "UserGroup", back_populates="group"
    )

    @property
    def home_folder_id(self) -> UUID | None:
        """
        Get the home folder ID for this group.

        This property provides backward compatibility with code that expects
        home_folder_id to be a column on the Group model.

        Returns:
            UUID of home folder, or None if not found
        """
        # Import here to avoid circular imports
        from papermerge.core.features.special_folders.db.orm import FolderType

        for sf in self.special_folders:
            if sf.folder_type == FolderType.HOME:
                return sf.folder_id
        return None

    @property
    def inbox_folder_id(self) -> UUID | None:
        """
        Get the inbox folder ID for this group.

        This property provides backward compatibility with code that expects
        inbox_folder_id to be a column on the Group model.

        Returns:
            UUID of inbox folder, or None if not found
        """
        # Import here to avoid circular imports
        from papermerge.core.features.special_folders.db.orm import FolderType

        for sf in self.special_folders:
            if sf.folder_type == FolderType.INBOX:
                return sf.folder_id
        return None

    @property
    def home_folder(self) -> "Folder | None":
        """
        Get the home Folder object for this group.

        Returns:
            Folder object or None if not found
        """
        from papermerge.core.features.special_folders.db.orm import FolderType

        for sf in self.special_folders:
            if sf.folder_type == FolderType.HOME:
                return sf.folder
        return None

    @property
    def inbox_folder(self) -> "Folder | None":
        """
        Get the inbox Folder object for this group.

        Returns:
            Folder object or None if not found
        """
        from papermerge.core.features.special_folders.db.orm import FolderType

        for sf in self.special_folders:
            if sf.folder_type == FolderType.INBOX:
                return sf.folder
        return None

    @property
    def has_special_folders(self) -> bool:
        """
        Check if this group has both home and inbox folders.

        Returns:
            True if group has both home and inbox, False otherwise
        """
        from papermerge.core.features.special_folders.db.orm import FolderType

        folder_types = {sf.folder_type for sf in self.special_folders}
        return FolderType.HOME in folder_types and FolderType.INBOX in folder_types

    # Convenience property
    @property
    def active_users(self):
        """Get list of active (non-deleted) users in this group"""
        return [ug.user for ug in self.user_groups if ug.deleted_at is None]

    def __str__(self):
        return f"Group(name={self.name}, id={self.id})"

    def __repr__(self):
        return str(self)

    __table_args__ = (
        CheckConstraint("char_length(trim(name)) > 0", name="group_name_not_empty"),
        # partially unique index: unique only for records where `deleted_at IS NULL`
        Index(
            'idx_groups_name_active_unique',
            'name',
            unique=True,
            postgresql_where=text('deleted_at IS NULL')
        ),
    )
    __mapper_args__ = {"confirm_deleted_rows": False}
