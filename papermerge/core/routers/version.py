import importlib

from fastapi import APIRouter, Depends

from papermerge.core import schemas
from core.auth import get_current_user

router = APIRouter(
    prefix="/version",
    tags=["version"],
)


@router.get("/")
async def get_version(
    user: schemas.User = Depends(get_current_user),
) -> schemas.Version:
    """Papermerge REST API version"""
    version_str = importlib.metadata.version("papermerge-core")

    return schemas.Version(version=version_str)
