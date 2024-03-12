from sqlalchemy import Engine
from sqlalchemy.orm import sessionmaker

from papermerge.core import db


def test_group_create(db_engine: Engine):
    Session = sessionmaker(db_engine)
    with Session() as session:
        db.sync_perms(session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = db.create_group(
        db_engine,
        "G1",
        scopes=list(scopes)
    )
    group_details = db.get_group(db_engine, group_id=group.id)

    assert group_details.name == 'G1'
    assert set(group_details.scopes) == scopes

    db.delete_group(db_engine, group.id)


def test_group_create_and_delete(db_engine: Engine):
    """Deleting a group should preserve existing permission models"""
    Session = sessionmaker(db_engine)
    with Session() as session:
        db.sync_perms(session)
        initial_perms_count = len(db.get_perms(session))

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = db.create_group(
        db_engine,
        "G1",
        scopes=list(scopes)
    )
    db.delete_group(db_engine, group_id=group.id)

    with Session() as session:
        perms_count = len(db.get_perms(session))
        # the `db.delete_group` should not affect
        # permissions count
        assert perms_count == initial_perms_count
