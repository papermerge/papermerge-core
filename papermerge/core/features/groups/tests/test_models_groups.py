from papermerge.core import dbapi


def test_group_create(db_session):
    group = dbapi.create_group(db_session, "G1")
    group_details = dbapi.get_group(db_session, group_id=group.id)

    assert group_details.name == "G1"

    dbapi.delete_group(db_session, group.id)
