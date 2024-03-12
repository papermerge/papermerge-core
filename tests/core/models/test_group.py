from sqlalchemy import Engine
from sqlalchemy.orm import sessionmaker

from papermerge.core import db


def test_group_create(db_engine: Engine):
    sync_scopes(db_engine)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = db.create_group(
        db_engine,
        "G1",
        scopes=list(scopes)
    )
    group_details = db.get_group(db_engine, group_id=group.id)

    assert group_details.name == 'G1'
    assert set(group_details.scopes) == scopes


def sync_scopes(db_engine):
    Session = sessionmaker(db_engine)
    with Session() as session:
        db.sync_perms(session)
