from uuid import UUID

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import Folder, Node

from .common import get_ancestors


def get_folder(
    engine: Engine,
    folder_id: UUID,
    user_id: UUID
):
    with Session(engine) as session:
        breadcrumb = get_ancestors(session, folder_id)
        stmt = select(Folder).where(
            Folder.id == folder_id,
            Node.user_id == user_id
        )
        db_model = session.scalars(stmt).one()
        model = schemas.Folder.model_validate(db_model)
        model.breadcrumb = breadcrumb

    return model
