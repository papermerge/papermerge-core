import logging

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import Permission

logger = logging.getLogger(__name__)


def get_perms(
    engine: Engine
) -> list[schemas.Permission]:
    with Session(engine) as session:
        db_perms = session.scalars(select(Permission))
        model_perms = [
            schemas.Permission.model_validate(db_perm)
            for db_perm in db_perms
        ]

    return model_perms
