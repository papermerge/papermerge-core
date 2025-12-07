from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .engine import get_db

DBRouterAsyncSession = Annotated[AsyncSession, Depends(get_db)]


__all__ = ["DBRouterAsyncSession", "AsyncSession"]
