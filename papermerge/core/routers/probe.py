from fastapi import APIRouter, Response
from sqlalchemy import text

from papermerge.core.db import get_engine

router = APIRouter(
    prefix="/probe",
    tags=["probe"],
)


@router.get("/")
def probe_endpoint():
    """Liveness probe endpoint"""
    engine = get_engine()
    with engine.connect() as connection:
        connection.execute(text("select 1"))

    return Response()
