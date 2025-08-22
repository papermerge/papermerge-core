import uuid
from uuid import UUID

from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.db.audit_cols import AuditColumns
from papermerge.core.db.base import Base

user_groups_association = Table(
    "users_groups",
    Base.metadata,
    Column(
        "user_id",
        ForeignKey("users.id"),
    ),
    Column(
        "group_id",
        ForeignKey("groups.id"),
    ),
)


class Group(Base, AuditColumns):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(unique=True)
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
        primaryjoin="Group.home_folder_id == Folder.id",
        back_populates="group",
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
        primaryjoin="Group.inbox_folder_id == Folder.id",
        back_populates="group",
        viewonly=True,
        cascade="delete",
    )
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        secondary=user_groups_association, back_populates="groups"
    )

    def __str__(self):
        return f"Group(name={self.name}, id={self.id})"

    def __repr__(self):
        return str(self)
