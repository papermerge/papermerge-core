from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    String, DateTime, CheckConstraint,
    Index, UniqueConstraint, func
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from papermerge.core.db.base import Base
from papermerge.core.types import OwnerType, ResourceType


class Ownership(Base):
    """
    Central table managing ownership relationships.

    One resource can have ONE owner (enforced by unique constraint).
    If you need multi-ownership in future, remove the unique constraint.
    """
    __tablename__ = "ownerships"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Who owns it
    owner_type: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)

    # What is owned
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        # Ensure valid owner types
        CheckConstraint(
            "owner_type IN ('user', 'group'",
            name="ownerships_owner_type_check"
        ),

        # Ensure valid resource types
        CheckConstraint(
            "resource_type IN ('node', 'custom_field', 'document_type', 'tag')",
            name="ownerships_resource_type_check"
        ),

        # ONE owner per resource (remove if you want multi-ownership)
        UniqueConstraint('resource_type', 'resource_id', name='uq_resource_owner'),

        # Fast lookups by owner
        Index('idx_ownerships_owner', 'owner_type', 'owner_id'),

        # Fast lookups by resource
        Index('idx_ownerships_resource', 'resource_type', 'resource_id'),

        # Composite index for filtered queries
        Index('idx_ownerships_owner_resource', 'owner_type', 'owner_id', 'resource_type'),
    )

    def __repr__(self):
        return (
            f"<Ownership(id={self.id}, "
            f"{self.resource_type}:{self.resource_id} -> "
            f"{self.owner_type}:{self.owner_id})>"
        )


class OwnedResourceMixin:
    """
    Mixin to add ownership helper methods to resource models.
    Add this to your resource classes for convenience.

    Usage:
        class Node(Base, OwnedResourceMixin):
            ...
    """

    @property
    def resource_type(self) -> ResourceType:
        """Return the resource type enum for this model"""
        # Map table name to resource type
        mapping = {
            'nodes': ResourceType.NODE,
            'custom_fields': ResourceType.CUSTOM_FIELD,
            'document_types': ResourceType.DOCUMENT_TYPE,
            'tags': ResourceType.TAG,
        }
        return mapping.get(self.__tablename__)

    def get_ownership(self, session):
        """Get the ownership record for this resource"""
        return session.query(Ownership).filter(
            Ownership.resource_type == self.resource_type.value,
            Ownership.resource_id == self.id
        ).first()

    def get_owner_info(self, session) -> tuple[OwnerType, int] | None:
        """Get (owner_type, owner_id) tuple for this resource"""
        ownership = self.get_ownership(session)
        if ownership:
            return (OwnerType(ownership.owner_type), ownership.owner_id)
        return None

    def is_owned_by(self, session, owner_type: OwnerType, owner_id: int) -> bool:
        """Check if resource is owned by specific owner"""
        ownership = self.get_ownership(session)
        return (
                ownership is not None
                and ownership.owner_type == owner_type.value
                and ownership.owner_id == owner_id
        )

    def set_owner(self, session, owner_type: OwnerType, owner_id: int):
        """
        Set or update the owner of this resource.
        Creates or updates the ownership record.
        """
        ownership = self.get_ownership(session)

        if ownership:
            # Update existing
            ownership.owner_type = owner_type.value
            ownership.owner_id = owner_id
        else:
            # Create new
            ownership = Ownership(
                owner_type=owner_type.value,
                owner_id=owner_id,
                resource_type=self.resource_type.value,
                resource_id=self.id
            )
            session.add(ownership)
