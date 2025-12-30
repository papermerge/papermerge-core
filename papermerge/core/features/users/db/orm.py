import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import func, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import TIMESTAMP

from papermerge.core.utils.tz import utc_now
from papermerge.core.db.base import Base
from papermerge.core import constants as const


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, insert_default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(const.USERNAME_MAX_LENGTH), unique=True)
    email: Mapped[str] = mapped_column(String(const.EMAIL_MAX_LENGTH), unique=True)
    password: Mapped[str] = mapped_column(String(const.PASSWORD_MAX_LENGTH), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(const.NAME_MAX_LENGTH), default=None)
    last_name: Mapped[str | None] = mapped_column(String(const.NAME_MAX_LENGTH), default=None)
    is_superuser: Mapped[bool] = mapped_column(default=False)
    is_staff: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=False)

    ### User does not use AuditColumns mixin because the mixin mandates
    # that `created_by`/`updated_by` will be NOT NULL. However, "system user"
    # cannot create itself -> for system user `created_by`/`updated_by` must
    # be set to NULL -> for `users` table the `created_by`/`updated_by` are
    # defined to allow NULL values.

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=utc_now,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=utc_now,
        onupdate=func.now(),
        nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )
    archived_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )

    # created by NULL only for "system user"
    created_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT", deferrable=True, initially='DEFERRED'),
        nullable=True
    )
    # updated_by NULL only for "system user"
    updated_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT", deferrable=True, initially='DEFERRED'),
        nullable=True
    )
    deleted_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    archived_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    special_folders: Mapped[list["SpecialFolder"]] = relationship(
        "SpecialFolder",
        primaryjoin=(
            "and_("
            "foreign(SpecialFolder.owner_id) == User.id, "
            "SpecialFolder.owner_type == 'user'"
            ")"
        ),
        viewonly=True,
        lazy="selectin",  # Eager load special folders with user
        cascade="delete"  # Delete special folders when user is deleted
    )

    date_joined: Mapped[datetime] = mapped_column(insert_default=func.now())

    user_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="user",
        foreign_keys="UserRole.user_id"
    )

    user_groups: Mapped[list["UserGroup"]] = relationship(
        "UserGroup",
        back_populates="user",
        foreign_keys="UserGroup.user_id"
    )

    api_tokens: Mapped[list["APIToken"]] = relationship(
        "APIToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @property
    def home_folder_id(self) -> UUID | None:
        """
        Get the home folder ID for this user.

        This property provides backward compatibility with code that expects
        home_folder_id to be a column on the User model.

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
        Get the inbox folder ID for this user.

        This property provides backward compatibility with code that expects
        inbox_folder_id to be a column on the User model.

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
        Get the home Folder object for this user.

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
        Get the inbox Folder object for this user.

        Returns:
            Folder object or None if not found
        """
        from papermerge.core.features.special_folders.db.orm import FolderType

        for sf in self.special_folders:
            if sf.folder_type == FolderType.INBOX:
                return sf.folder
        return None

    # Convenience properties for active relationships
    @property
    def active_roles(self):
        """Get list of active (non-deleted) roles for this user"""
        return [ur.role for ur in self.user_roles if ur.deleted_at is None]

    @property
    def active_groups(self):
        """Get list of active (non-deleted) groups for this user"""
        return [ug.group for ug in self.user_groups if ug.deleted_at is None]

    def __repr__(self):
        return f"User({self.id=}, {self.username=})"

    __mapper_args__ = {"confirm_deleted_rows": False}
