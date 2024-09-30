import logging

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from papermerge.core import schemas
from papermerge.core.db import models

logger = logging.getLogger(__name__)


def create_custom_field(
    db_session: Session,
    name: str,
    data_type: str,
    extra_data: str,
    exists_ok: bool = False,
) -> schemas.CustomField:
    pass
