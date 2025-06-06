from fastapi import APIRouter, Response, Depends
from sqlalchemy import text

from papermerge.core import db

router = APIRouter(
    prefix="/probe",
    tags=["probe"],
)


@router.get("/")
def probe_endpoint(db_session=Depends(db.get_db)):
    """Liveness probe endpoint"""
    db_session.execute(text("select 1"))

    return Response()
