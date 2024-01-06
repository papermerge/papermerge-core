from datetime import datetime
from typing import Literal
from uuid import UUID

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    created_at: Mapped[datetime] = mapped_column(
        insert_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(),
        onupdate=func.now()
    )


class User(Base):
    __tablename__ = "core_user"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    username: Mapped[str]
    email: Mapped[str]
    first_name: Mapped[str]
    last_name: Mapped[str]


CType = Literal["document", "folder"]


class Node(Base):
    __tablename__ = "core_basetreenode"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    ctype: Mapped[CType]
    lang: Mapped[str] = mapped_column(String(8))
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(User.id),
        back_populates="nodes"
    )
    parent_id: Mapped[UUID] = mapped_column(ForeignKey("node.id"))

    __mapper_args__ = {
        "polymorphic_identity": "node",
        "polymorphic_on": "ctype",
    }

    def __repr__(self):
        return f"{self.__class__.__name__}({self.title!r})"


class Folder(Node):
    __tablename__ = "core_folder"

    id: Mapped[UUID] = mapped_column(
        'basetreenode_ptr_id',
        ForeignKey("core_basetreenode.id"), primary_key=True
    )

    __mapper_args__ = {
        "polymorphic_identity": "folder",
    }


class Document(Node):
    __tablename__ = "core_document"

    id: Mapped[UUID] = mapped_column(
        'basetreenode_ptr_id',
        ForeignKey("core_basetreenode.id"), primary_key=True
    )

    ocr: Mapped[bool]
    ocr_status: Mapped[str]

    __mapper_args__ = {
        "polymorphic_identity": "document",
    }
