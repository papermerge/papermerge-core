from fastapi import Request, HTTPException
from papermerge.core.models import User


def get_current_user(request: Request) -> User:
    """
    Retrieves current user based on the value in REMOTE_USER
    header

    REMOTE_USER header should contain valid user uuid
    """
    user_id = request.headers.get('REMOTE_USER')

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="REMOTE_USER header is empty"
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=401,
            detail="Remote user not found"
        )

    return user
