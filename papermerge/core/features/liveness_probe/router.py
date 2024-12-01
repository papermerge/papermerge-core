from fastapi import APIRouter, Response
from sqlalchemy import text

from papermerge.core.db.engine import Session

router = APIRouter(
    prefix="/probe",
    tags=["probe"],
)


@router.get("/")
def probe_endpoint():
    """Liveness probe endpoint"""
    with Session() as db_session:
        db_session.execute(text("select 1"))

    return Response()
