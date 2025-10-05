import uuid
from uuid import UUID

from sqlalchemy import CheckConstraint, Index, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.db.base import Base


class UserGroup(Base, AuditColumns):
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

    # Entire group is marked for deletion.
    # Groups deletion is done async as groups may have
    # associated documents and folders
    delete_me: Mapped[bool] = mapped_column(default=False, nullable=True)

    # User created group with special folders
    # and later decided that group does not need to have special
    # folders anymore. In such case, `remove_special_folders` is set
    # to True and async scheduler will take care of special folder
    # removal and setting to NULL of `home_folder_id` as well `inbox_folder_id`
    # columns
    delete_special_folders: Mapped[bool] = mapped_column(default=False, nullable=True)

    nodes: Mapped[list["Node"]] = relationship(
        back_populates="group",
        primaryjoin="Group.id == Node.group_id",
        cascade="delete",
    )

    home_folder_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "folders.node_id",
            deferrable=True,
            ondelete="CASCADE",
            name="groups_home_folder_id_fkey",
        ),
        nullable=True,
    )
    home_folder: Mapped["Folder"] = relationship(
        "Folder",
        primaryjoin="Group.home_folder_id == Folder.id",
        foreign_keys=[home_folder_id],
        back_populates="home_group",
        viewonly=True,
        cascade="delete",
    )

    inbox_folder_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "folders.node_id",
            deferrable=True,
            ondelete="CASCADE",
            name="groups_inbox_folder_id_fkey",
        ),
        nullable=True,
    )
    inbox_folder: Mapped["Folder"] = relationship(
        "Folder",
        primaryjoin="Group.inbox_folder_id == Folder.id",
        foreign_keys=[inbox_folder_id],
        back_populates="inbox_group",
        viewonly=True,
        cascade="delete",
    )

    user_groups: Mapped[list["UserGroup"]] = relationship(
        "UserGroup", back_populates="group"
    )

    # Convenience property to get active users
    @property
    def active_users(self):
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
