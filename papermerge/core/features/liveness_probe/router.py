from fastapi import APIRouter, Response, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.db.engine import get_db

router = APIRouter(
    prefix="/probe",
    tags=["probe"],
)


@router.get("/")
async def probe_endpoint(db_session: AsyncSession = Depends(get_db)):
    """Liveness probe endpoint"""
    await db_session.execute(text("select 1"))

    return Response()
