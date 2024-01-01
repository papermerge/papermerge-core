import logging

from django.core.cache import cache
from fastapi import HTTPException

from papermerge.core.models import User

logger = logging.getLogger(__name__)


def get_user_by_id(user_id: str, detail: str) -> User:
    user = cache.get(user_id)
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

    cache.set(user_id, user)

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
