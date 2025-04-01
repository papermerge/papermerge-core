from sqlalchemy.orm import Session
from papermerge.core import orm, dbapi


def test_get_document_types_grouped_by_owner_without_pagination(
    db_session: Session, make_document_type, user, make_group
):
    family: orm.Group = make_group("Family")
    make_document_type(name="Family Shopping", group_id=family.id)
    make_document_type(name="Bills", group_id=family.id)
    make_document_type(name="My Private", user=user)

    user.groups.append(family)
    db_session.add(user)
    db_session.commit()

    results = dbapi.get_document_types_grouped_by_owner_without_pagination(
        db_session, user_id=user.id
    )

    assert len(results) == 2
