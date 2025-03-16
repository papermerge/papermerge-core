from papermerge.core.features.roles import schema
from papermerge.core.features.roles.db import api as dbapi


def test_role_create(db_session):
    dbapi.sync_perms(db_session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    role, _ = dbapi.create_role(db_session, "G1", scopes=list(scopes))
    role_details = dbapi.get_role(db_session, role_id=role.id)

    assert role_details.name == "G1"
    assert set(role_details.scopes) == scopes

    dbapi.delete_role(db_session, role.id)


def test_role_create_and_delete(db_session):
    """Deleting a role should preserve existing permission models"""
    dbapi.sync_perms(db_session)
    initial_perms_count = len(dbapi.get_perms(db_session))

    scopes = {"tag.update", "tag.create", "tag.delete"}

    role, _ = dbapi.create_role(db_session, "G1", scopes=list(scopes))
    dbapi.delete_role(db_session, role_id=role.id)

    perms_count = len(dbapi.get_perms(db_session))
    # the `db.delete_role` should not affect
    # permissions count
    assert perms_count == initial_perms_count


def test_update_role_twice(db_session):
    """Update role twice

    There should be no error when update role second time with same scopes.
    """
    dbapi.sync_perms(db_session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    role, _ = dbapi.create_role(db_session, "G1", scopes=list(scopes))
    # this method SHOULD NOT raise an exception
    dbapi.update_role(
        db_session,
        role_id=role.id,
        attrs=schema.UpdateRole(name=role.name, scopes=list(scopes)),
    )

    dbapi.delete_role(db_session, role_id=role.id)


def test_remove_permissions_from_role(db_session):
    """Remove permissions from role"""
    dbapi.sync_perms(db_session)

    scopes = {"tag.update", "tag.create", "tag.delete"}

    role, _ = dbapi.create_role(db_session, "G1", scopes=list(scopes))

    role_details = dbapi.get_role(db_session, role_id=role.id)
    assert set(role_details.scopes) == scopes

    dbapi.update_role(
        db_session,
        role_id=role.id,
        attrs=schema.UpdateRole(
            name=role.name,
            scopes=["tag.update"],  # role will have only one perm
        ),
    )

    role_details = dbapi.get_role(db_session, role_id=role.id)
    # Indeed? Only one scope?
    assert role_details.scopes == ["tag.update"]

    dbapi.delete_role(db_session, role_id=role.id)
