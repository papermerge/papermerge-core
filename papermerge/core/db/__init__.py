import logging

from django.core.cache import cache
from fastapi import HTTPException

from papermerge.core.models import Folder, User

logger = logging.getLogger(__name__)


def get_folder_by_id(folder_id: str, user_id: str) -> Folder:
    folder = cache.get(f"folder_id_{folder_id}")

    if folder:
        logger.debug(f"Folder {folder}/{folder_id} fetched from CACHE")
        return folder

    logger.debug(f"Folder {folder}/{folder_id} getting from DB")
    folder = Folder.objects.get(id=folder_id, user_id=user_id)
    cache.set(f"folder_id_{folder_id}", folder)

    return folder


def get_user_by_id(user_id: str, detail: str) -> User:
    user = cache.get(f"user_id_{user_id}")
    if user:
        logger.debug(f"User {user} fetched from CACHE")
        return user

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=401,
            detail=detail
        )

    cache.set(f"user_id_{user_id}", user)

    return user


def get_user_by_username(username: str, detail: str) -> User:
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=401,
            detail=detail
        )

    return user
