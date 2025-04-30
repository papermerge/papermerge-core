import importlib

from fastapi import APIRouter, Depends

from papermerge.core import schema
from papermerge.core.features.auth import get_current_user

router = APIRouter(
    prefix="/version",
    tags=["version"],
)


@router.get("/")
async def get_version(
    user: schema.User = Depends(get_current_user),
) -> schema.Version:
    """Papermerge REST API version"""
    version_str = importlib.metadata.version("papermerge")

    return schema.Version(version=version_str)
