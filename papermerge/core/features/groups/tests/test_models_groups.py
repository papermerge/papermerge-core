from papermerge.core.features.groups import schema
from papermerge.core.features.groups.db import api as dbapi


def test_group_create(db_session):
    dbapi.sync_perms(db_session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = dbapi.create_group(db_session, "G1", scopes=list(scopes))
    group_details = dbapi.get_group(db_session, group_id=group.id)

    assert group_details.name == "G1"
    assert set(group_details.scopes) == scopes

    dbapi.delete_group(db_session, group.id)


def test_group_create_and_delete(db_session):
    """Deleting a group should preserve existing permission models"""
    dbapi.sync_perms(db_session)
    initial_perms_count = len(dbapi.get_perms(db_session))

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = dbapi.create_group(db_session, "G1", scopes=list(scopes))
    dbapi.delete_group(db_session, group_id=group.id)

    perms_count = len(dbapi.get_perms(db_session))
    # the `db.delete_group` should not affect
    # permissions count
    assert perms_count == initial_perms_count


def test_update_group_twice(db_session):
    """Update group twice

    There should be no error when update group second time with same scopes.
    """
    dbapi.sync_perms(db_session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = dbapi.create_group(db_session, "G1", scopes=list(scopes))
    # this method SHOULD NOT raise an exception
    dbapi.update_group(
        db_session,
        group_id=group.id,
        attrs=schema.UpdateGroup(name=group.name, scopes=list(scopes)),
    )

    dbapi.delete_group(db_session, group_id=group.id)


def test_remove_permissions_from_group(db_session):
    """Remove permissions from group"""
    dbapi.sync_perms(db_session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    group = dbapi.create_group(db_session, "G1", scopes=list(scopes))

    group_details = dbapi.get_group(db_session, group_id=group.id)
    assert set(group_details.scopes) == scopes

    dbapi.update_group(
        db_session,
        group_id=group.id,
        attrs=schema.UpdateGroup(
            name=group.name,
            scopes=["tag.update"],  # group will have only one perm
        ),
    )

    group_details = dbapi.get_group(db_session, group_id=group.id)
    # Indeed? Only one scope?
    assert group_details.scopes == ["tag.update"]

    dbapi.delete_group(db_session, group_id=group.id)
