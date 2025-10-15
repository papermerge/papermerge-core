from uuid import UUID
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from papermerge.core.types import OwnerType


class Owner(BaseModel):
    owner_type: OwnerType
    owner_id: UUID

    @staticmethod
    def create_from(
        user_id: UUID | None = None,
        group_id: UUID | None = None
    ) -> "Owner":
        if group_id is not None:
            return Owner(owner_type=OwnerType.GROUP, owner_id=group_id)
        elif user_id is not None:
            return Owner(owner_type=OwnerType.USER, owner_id=user_id)
        else:
            raise ValueError("Either user_id or group_id must be provided")


class OwnerInfo(BaseModel):
    """Basic owner information"""
    owner_type: Literal["user", "group",]
    owner_id: UUID
    owner_name: str  # For display purposes

    model_config = ConfigDict(from_attributes=True)


class SetOwner(BaseModel):
    """Request body to set/change ownership"""
    owner_type: OwnerType
    owner_id: UUID


class ResourceOwnership(BaseModel):
    """Complete ownership information for a resource"""
    resource_type: Literal["node", "tag", "custom_field", "document_type"]
    resource_id: UUID
    owner: OwnerInfo
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OwnershipSummary(BaseModel):
    """Summary of resources owned by an owner"""
    owner: OwnerInfo
    nodes_count: int
    tags_count: int
    custom_fields_count: int
    document_types_count: int


class TransferOwnershipRequest(BaseModel):
    """Request to transfer ownership of resources (future feature)"""
    resource_ids: list[UUID]
    resource_type: Literal["node", "tag", "custom_field", "document_type"]
    new_owner_type: OwnerType
    new_owner_id: UUID
