import logging
from uuid import UUID

from sqlalchemy import Engine

from papermerge.core import schemas

logger = logging.getLogger(__name__)


def get_group(
    engine: Engine,
    group_id: str
) -> schemas.Group:
    pass


def get_groups(
    engine: Engine
) -> list[schemas.Group]:
    pass


def create_group(
    engine: Engine,
    name: str,
    scopes: list[str],
) -> schemas.Group:
    pass


def update_group(
    engine: Engine,
    id: UUID,
    group: schemas.UpdateGroup
):
    pass


def delete_group(
    engine: Engine,
    group_id: UUID,
):
    pass
