import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from papermerge.core.features.groups.db.orm import (
    user_groups_association,
    user_permissions_association,
)
from papermerge.core.types import CType

from .base import Base


class DocumentTypeCustomField(Base):
    __tablename__ = "document_type_custom_field"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_type_id: Mapped[UUID] = mapped_column(ForeignKey("document_types.id"))

    custom_field_id: Mapped[UUID] = mapped_column(
        ForeignKey("custom_fields.id"),
    )


class User(Base):
    __tablename__ = "core_user"

    id: Mapped[UUID] = mapped_column(primary_key=True, insert_default=uuid.uuid4())
    username: Mapped[str]
    email: Mapped[str]
    password: Mapped[str]
    first_name: Mapped[str] = mapped_column(default=" ")
    last_name: Mapped[str] = mapped_column(default=" ")
    is_superuser: Mapped[bool] = mapped_column(default=False)
    is_staff: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=False)
    nodes: Mapped[list["Node"]] = relationship(
        back_populates="user", primaryjoin="User.id == Node.user_id"
    )
    home_folder_id: Mapped[UUID] = mapped_column(
        ForeignKey("core_folder.basetreenode_ptr_id", deferrable=True), nullable=True
    )
    home_folder: Mapped["Folder"] = relationship(
        primaryjoin="User.home_folder_id == Folder.id",
        back_populates="user",
        viewonly=True,
    )
    inbox_folder_id: Mapped[UUID] = mapped_column(
        ForeignKey("core_folder.basetreenode_ptr_id", deferrable=True), nullable=True
    )
    inbox_folder: Mapped["Folder"] = relationship(
        primaryjoin="User.home_folder_id == Folder.id",
        back_populates="user",
        viewonly=True,
    )
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())
    date_joined: Mapped[datetime] = mapped_column(insert_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(), onupdate=func.now()
    )
    permissions: Mapped[list["Permission"]] = relationship(  # noqa: F821
        secondary=user_permissions_association, back_populates="users"
    )
    groups: Mapped[list["Group"]] = relationship(  # noqa: F821
        secondary=user_groups_association, back_populates="users"
    )


class Node(Base):
    __tablename__ = "core_basetreenode"

    id: Mapped[UUID] = mapped_column(primary_key=True, insert_default=uuid.uuid4())
    title: Mapped[str] = mapped_column(String(200))
    ctype: Mapped[CType]
    lang: Mapped[str] = mapped_column(String(8))
    tags: list[str] = []
    user: Mapped["User"] = relationship(
        back_populates="nodes", primaryjoin="User.id == Node.user_id"
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "core_user.id", use_alter=True, name="core_basetreenode_user_id_fkey"
        )
    )
    parent_id: Mapped[UUID] = mapped_column(
        ForeignKey("core_basetreenode.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(insert_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(), onupdate=func.now()
    )

    __mapper_args__ = {
        "polymorphic_identity": "node",
        "polymorphic_on": "ctype",
    }

    def __repr__(self):
        return f"{self.__class__.__name__}({self.title!r})"


class Folder(Node):
    __tablename__ = "core_folder"

    id: Mapped[UUID] = mapped_column(
        "basetreenode_ptr_id",
        ForeignKey("core_basetreenode.id"),
        primary_key=True,
        insert_default=uuid.uuid4(),
    )

    __mapper_args__ = {
        "polymorphic_identity": "folder",
    }


class DocumentVersion(Base):
    __tablename__ = "core_documentversion"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    number: Mapped[int]
    file_name: Mapped[str]
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("core_document.basetreenode_ptr_id")
    )
    lang: Mapped[str]
    short_description: Mapped[str]


class Page(Base):
    __tablename__ = "core_page"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    number: Mapped[int]
    lang: Mapped[str]
    text: Mapped[str]
    document_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("core_documentversion.id")
    )


class Tag(Base):
    __tablename__ = "core_tag"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str]
    bg_color: Mapped[str]
    fg_color: Mapped[str]
    description: Mapped[str]
    pinned: Mapped[bool]


class ColoredTag(Base):
    __tablename__ = "core_coloredtag"
    id: Mapped[int] = mapped_column(primary_key=True)
    object_id: Mapped[UUID]
    tag_id: Mapped[UUID] = mapped_column(ForeignKey("core_tag.id"))
    tag: Mapped["Tag"] = relationship(primaryjoin="Tag.id == ColoredTag.tag_id")


class ContentType(Base):
    __tablename__ = "django_content_type"

    id: Mapped[int] = mapped_column(primary_key=True)
    app_label: Mapped[str]
    model: Mapped[str]
