from sqlalchemy import Engine
from sqlalchemy.orm import sessionmaker

from papermerge.core import db, schemas


def test_group_create(db_engine: Engine):
    Session = sessionmaker(db_engine)
    db_session = Session()
    with db_session as session:
        db.sync_perms(session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = db.create_group(
        Session(),
        "G1",
        scopes=list(scopes)
    )
    group_details = db.get_group(db_session, group_id=group.id)

    assert group_details.name == 'G1'
    assert set(group_details.scopes) == scopes

    db.delete_group(db_session, group.id)


def test_group_create_and_delete(db_engine: Engine):
    """Deleting a group should preserve existing permission models"""
    Session = sessionmaker(db_engine)
    db_session = Session()
    with db_session as session:
        db.sync_perms(session)
        initial_perms_count = len(db.get_perms(session))

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = db.create_group(
        db_session,
        "G1",
        scopes=list(scopes)
    )
    db.delete_group(db_session, group_id=group.id)

    with db_session as session:
        perms_count = len(db.get_perms(session))
        # the `db.delete_group` should not affect
        # permissions count
        assert perms_count == initial_perms_count


def test_update_group_twice(db_engine: Engine):
    """Update group twice

    There should be no error when update group second time with same scopes.
    """
    Session = sessionmaker(db_engine)
    db_session = Session()
    with db_session as session:
        db.sync_perms(session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = db.create_group(
        db_session,
        "G1",
        scopes=list(scopes)
    )
    # this method SHOULD NOT raise an exception
    db.update_group(
        db_session,
        group_id=group.id,
        attrs=schemas.UpdateGroup(
            name=group.name,
            scopes=list(scopes)
        )
    )

    db.delete_group(db_session, group_id=group.id)


def test_remove_permissions_from_group(db_engine: Engine):
    """Remove permissions from group"""
    Session = sessionmaker(db_engine)
    db_session = Session()

    with db_session as session:
        db.sync_perms(session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = db.create_group(
        db_session,
        "G1",
        scopes=list(scopes)
    )

    group_details = db.get_group(db_session, group_id=group.id)
    assert set(group_details.scopes) == scopes

    db.update_group(
        db_session,
        group_id=group.id,
        attrs=schemas.UpdateGroup(
            name=group.name,
            scopes=["tag.update"]   # group will have only one perm
        )
    )

    group_details = db.get_group(db_session, group_id=group.id)
    # Indeed? Only one scope?
    assert group_details.scopes == ["tag.update"]

    db.delete_group(db_session, group_id=group.id)
