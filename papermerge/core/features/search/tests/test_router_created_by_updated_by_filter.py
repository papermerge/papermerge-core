from papermerge.core import db, orm, types
from papermerge.core.tests.types import AuthTestClient
from papermerge.core.features.ownership.db.api import set_owners

async def test_very_basic_created_by(
    auth_api_client: AuthTestClient,
    db_session: db.AsyncSession,
    make_user,
    make_group,
    make_document
):
    team: orm.Group = await make_group("The Team")
    john: orm.User = await make_user("john")
    luke: orm.User = await make_user("luke")
    user_group1 = orm.UserGroup(user=john, group=team)
    user_group2 = orm.UserGroup(user=luke, group=team)
    db_session.add_all([user_group1, user_group2])
    await db_session.commit()

    doc1 = await make_document(title="john.pdf", user=john, parent=john.home_folder)
    doc2 = await make_document(title="luke.pdf", user=luke, parent=luke.home_folder)

    owner = types.Owner.create_from(group_id=team.id)

    await set_owners(
        session=db_session,
        resource_type=types.ResourceType.NODE,
        resource_ids=[doc1.id, doc2.id],
        owner=owner
    )

    payload = {
        "filters": {
            "created_by": [
                {
                    "value": str(john.id)
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()
    result = response.json()

    assert "items" in result
    returned_titles = {item["title"] for item in result["items"]}
    assert len(result["items"]) == 1
    assert "john.pdf" in returned_titles, "john.pdf should be found"
