"""
API functions for managing special folders.

This module provides helper functions for creating, retrieving,
and managing special folders (home, inbox, etc.) for users and groups.
"""

import uuid
from typing import Dict, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_

from papermerge.core import orm, constants
from papermerge.core.features.special_folders.db.orm import SpecialFolder
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.types import OwnerType, ResourceType, FolderType


async def create_special_folders_for_user(
        db_session: AsyncSession,
        user_id: UUID,
) -> Dict[str, UUID]:
    """
    Create home and inbox folders for a user.

    Args:
        db_session: Database session
        user_id: User ID

    Returns:
        Dictionary with 'home' and 'inbox' keys mapping to folder IDs
    """

    home_id = uuid.uuid4()
    inbox_id = uuid.uuid4()

    # Create the actual folder nodes WITHOUT user_id
    home_folder = orm.Folder(
        id=home_id,
        title=constants.HOME_TITLE,
        ctype=constants.CTYPE_FOLDER,
        lang="xxx",
    )
    inbox_folder = orm.Folder(
        id=inbox_id,
        title=constants.INBOX_TITLE,
        ctype=constants.CTYPE_FOLDER,
        lang="xxx",
    )

    db_session.add(home_folder)
    db_session.add(inbox_folder)
    await db_session.flush()

    # Set ownership for both folders
    await ownership_api.set_owner(
        session=db_session,
        resource_type=ResourceType.NODE,
        resource_id=home_id,
        owner_type=OwnerType.USER,
        owner_id=user_id
    )

    await ownership_api.set_owner(
        session=db_session,
        resource_type=ResourceType.NODE,
        resource_id=inbox_id,
        owner_type=OwnerType.USER,
        owner_id=user_id
    )

    # Create special folder entries
    home_special = SpecialFolder(
        owner_type=OwnerType.USER.value,
        owner_id=user_id,
        folder_type=FolderType.HOME.value,
        folder_id=home_id
    )
    inbox_special = SpecialFolder(
        owner_type=OwnerType.USER.value,
        owner_id=user_id,
        folder_type=FolderType.INBOX.value,
        folder_id=inbox_id
    )

    db_session.add_all([home_special, inbox_special])
    await db_session.flush()

    return {
        'home': home_id,
        'inbox': inbox_id
    }


async def create_special_folders_for_group(
    db_session: AsyncSession,
    group_id: UUID,
) -> Dict[str, UUID]:
    """
    Create home and inbox folders for a group.

    Args:
        db_session: Database session
        group_id: Group ID

    Returns:
        Dictionary with 'home' and 'inbox' keys mapping to folder IDs
    """
    home_id = uuid.uuid4()
    inbox_id = uuid.uuid4()

    # Create the actual folder nodes WITHOUT group_id
    home_folder = orm.Folder(
        id=home_id,
        title=constants.HOME_TITLE,
        ctype=constants.CTYPE_FOLDER,
        lang="xxx",
    )
    inbox_folder = orm.Folder(
        id=inbox_id,
        title=constants.INBOX_TITLE,
        ctype=constants.CTYPE_FOLDER,
        lang="xxx",
    )

    db_session.add(home_folder)
    db_session.add(inbox_folder)
    await db_session.flush()

    # Set ownership for both folders
    await ownership_api.set_owner(
        session=db_session,
        resource_type=ResourceType.NODE,
        resource_id=home_id,
        owner_type=OwnerType.GROUP,
        owner_id=group_id
    )

    await ownership_api.set_owner(
        session=db_session,
        resource_type=ResourceType.NODE,
        resource_id=inbox_id,
        owner_type=OwnerType.GROUP,
        owner_id=group_id
    )

    # Create special folder entries
    home_special = SpecialFolder(
        owner_type=OwnerType.GROUP.value,
        owner_id=group_id,
        folder_type=FolderType.HOME.value,
        folder_id=home_id
    )
    inbox_special = SpecialFolder(
        owner_type=OwnerType.GROUP.value,
        owner_id=group_id,
        folder_type=FolderType.INBOX.value,
        folder_id=inbox_id
    )

    db_session.add_all([home_special, inbox_special])
    await db_session.flush()

    return {
        'home': home_id,
        'inbox': inbox_id
    }


async def get_special_folder(
    db_session: AsyncSession,
    owner_type: OwnerType,
    owner_id: UUID,
    folder_type: FolderType
) -> Optional[SpecialFolder]:
    """
    Get a specific special folder for an owner.

    Args:
        db_session: Database session
        owner_type: Type of owner (USER or GROUP)
        owner_id: Owner's UUID
        folder_type: Type of folder (HOME or INBOX)

    Returns:
        SpecialFolder instance or None if not found
    """
    stmt = select(SpecialFolder).where(
        and_(
            SpecialFolder.owner_type == owner_type,
            SpecialFolder.owner_id == owner_id,
            SpecialFolder.folder_type == folder_type
        )
    )
    result = await db_session.execute(stmt)
    return result.scalar_one_or_none()


async def get_all_special_folders(
    db_session: AsyncSession,
    owner_type: OwnerType,
    owner_id: UUID
) -> list[SpecialFolder]:
    """
    Get all special folders for an owner.

    Args:
        db_session: Database session
        owner_type: Type of owner (USER or GROUP)
        owner_id: Owner's UUID

    Returns:
        List of SpecialFolder instances
    """
    stmt = select(SpecialFolder).where(
        and_(
            SpecialFolder.owner_type == owner_type,
            SpecialFolder.owner_id == owner_id
        )
    )
    result = await db_session.execute(stmt)
    return list(result.scalars().all())


async def has_special_folders(
    db_session: AsyncSession,
    owner_type: OwnerType,
    owner_id: UUID
) -> bool:
    """
    Check if owner has both home and inbox folders.

    Args:
        db_session: Database session
        owner_type: Type of owner (USER or GROUP)
        owner_id: Owner's UUID

    Returns:
        True if owner has both home and inbox, False otherwise
    """
    folders = await get_all_special_folders(db_session, owner_type, owner_id)
    folder_types = {f.folder_type for f in folders}
    return FolderType.HOME in folder_types and FolderType.INBOX in folder_types


async def delete_special_folders_for_group(
    db_session: AsyncSession,
    group_id: UUID
) -> None:
    """
    Delete special folders for a group.

    This should only be called when the user explicitly wants to remove
    special folders from a group. Users always keep their special folders.

    Args:
        db_session: Database session
        group_id: Group ID
    """
    # First get the folder IDs so we can delete the actual folders
    stmt = select(SpecialFolder).where(
        and_(
            SpecialFolder.owner_type == OwnerType.GROUP,
            SpecialFolder.owner_id == group_id
        )
    )
    result = await db_session.execute(stmt)
    special_folders = result.scalars().all()

    folder_ids = [sf.folder_id for sf in special_folders]

    # Delete special folder entries (this will happen automatically via trigger)
    stmt = delete(SpecialFolder).where(
        and_(
            SpecialFolder.owner_type == OwnerType.GROUP,
            SpecialFolder.owner_id == group_id
        )
    )
    await db_session.execute(stmt)

    # Delete the actual folder nodes
    if folder_ids:
        stmt = delete(orm.Folder).where(orm.Folder.id.in_(folder_ids))
        await db_session.execute(stmt)
