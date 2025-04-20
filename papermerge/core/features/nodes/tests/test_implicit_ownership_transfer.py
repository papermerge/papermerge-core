from sqlalchemy import select
from papermerge.core import orm


def test_upload_document_to_group_home(db_session, make_user, make_group, login_as):
    """
    Documents uploaded in group's home will be automatically owned by the group
    """
    group = make_group("hr", with_special_folders=True)
    user = make_user("john")
    user.groups.append(group)

    db_session.add(user)
    db_session.commit()

    payload = dict(
        ctype="document",
        title="cv.pdf",
        parent_id=str(group.home_folder.id),
    )

    client = login_as(user)

    response = client.post("/nodes/", json=payload)
    assert response.status_code == 201, response.json()

    doc = db_session.scalars(
        select(orm.Document).where(orm.Node.title == "cv.pdf")
    ).one()

    assert doc.group == group  # owned by group
    assert doc.user is None  # not by user
