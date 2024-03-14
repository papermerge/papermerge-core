import logging

from sqlalchemy import delete, select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.auth import scopes
from papermerge.core.db import models

logger = logging.getLogger(__name__)


def get_perms(
    db_session: Session
) -> list[schemas.Permission]:
    with db_session as session:
        db_perms = session.scalars(
            select(models.Permission).order_by('codename')
        )
        model_perms = [
            schemas.Permission.model_validate(db_perm)
            for db_perm in db_perms
        ]

    return model_perms


def sync_perms(
    db_session: Session
):
    """Syncs `core.auth.scopes.SCOPES` with `auth_permissions` table

    In other words makes sure that all scopes defined in
    `core.auth.scopes.SCOPES` are in `auth_permissions` table and other way
    around - any permission found in db table is also in
    `core.auth.scopes.SCOPES`.
    """
    # A. add missing scopes to perms table
    with db_session as session:
        scopes_to_be_added = []
        db_perms = session.scalars(select(models.Permission))
        model_perms = [
            schemas.Permission.model_validate(db_perm)
            for db_perm in db_perms
        ]
        perms_codenames = [perm.codename for perm in model_perms]

        # collect missing scopes
        for codename, desc in scopes.SCOPES.items():
            if codename not in perms_codenames:
                scopes_to_be_added.append((codename, desc))

        # content type is not used by the application anymore. It is
        # a leftover from Django auth system
        # Here we just add one fake... just to satisfy DB relation integrity
        try:
            content_type = session.scalars(select(models.ContentType).where(
                models.ContentType.app_label == "core",
                models.ContentType.model == "scope"
            )).one()
        except NoResultFound:
            content_type = None

        if content_type is None:
            content_type = models.ContentType(app_label="core", model="scope")
        # add missing content type (again, it is not used; legacy table layout)
        session.add(content_type)
        # add missing scopes
        for scope in scopes_to_be_added:
            session.add(
                models.Permission(
                    codename=scope[0],
                    name=scope[1],
                    content_type=content_type
                )
            )
        session.commit()

    # B. removes permissions not present in scopes
    with db_session as session:
        scope_codenames = [scope for scope in scopes.SCOPES.keys()]

        stmt = delete(models.Permission).where(
            models.Permission.codename.notin_(scope_codenames)
        )
        session.execute(stmt)
        session.commit()
