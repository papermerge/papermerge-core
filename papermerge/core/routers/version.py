import importlib

from fastapi import APIRouter, Depends

from papermerge.core.models import User
from papermerge.core.routers.auth import get_current_user as current_user
from papermerge.core.schemas import Version

router = APIRouter(
    prefix="/version",
    tags=["version"],
)


@router.get("/")
def get_version(user: User = Depends(current_user)) -> Version:
    """Papermerge REST API version"""
    version_str = importlib.metadata.version("papermerge-core")
    return Version(version=version_str)
