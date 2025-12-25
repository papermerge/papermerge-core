from papermerge.core import db, orm, types
from papermerge.core.features.ownership.db.api import set_owner


async def test_very_basic_owner_filtering_by_group(
    login_as,
    db_session: db.AsyncSession,
    make_user,
    make_group,
    make_document,
    system_user
):
    """Test filtering documents by group owner

    John is member of two groups: Alpha and Beta.
    In this scenario he
    1. searches all documents owned by team alpha (alpha_doc.pdf)
    2. searches all documents owned by team beta (beta_doc.pdf)
    """
    # =================================================================
    # Create two groups and users belonging to them
    # =================================================================
    team_alpha: orm.Group = await make_group("Team Alpha")
    team_beta: orm.Group = await make_group("Team Beta")

    john: orm.User = await make_user("john")

    # John belongs both to Alpha and Beta teams
    user_group1 = orm.UserGroup(
        user=john,
        group=team_alpha,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    user_group2 = orm.UserGroup(
        user=john,
        group=team_beta,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    db_session.add_all([user_group1, user_group2])
    await db_session.commit()

    doc1 = await make_document(title="alpha_doc.pdf", user=john, parent=john.home_folder)
    doc2 = await make_document(title="beta_doc.pdf", user=john, parent=john.home_folder)

    # =================================================================
    # Set different group owners for the documents
    # =================================================================
    owner_alpha = types.Owner.create_from(group_id=team_alpha.id)
    owner_beta = types.Owner.create_from(group_id=team_beta.id)

    await set_owner(
        session=db_session,
        resource=types.Resource(type=types.ResourceType.NODE, id=doc1.id),
        owner=owner_alpha
    )

    await set_owner(
        session=db_session,
        resource=types.NodeResource(id=doc2.id),
        owner=owner_beta
    )
    # ========= Login as John =========================================
    api_client = await login_as(john)

    # =================================================================
    # Search for documents owned by Team Alpha
    # =================================================================
    payload = {
        "filters": {
            "owner": [
                {
                    "value": {
                        "id": str(team_alpha.id),
                        "type": "group"
                    },
                    "operator": "eq"
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }
    response = await api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()
    result = response.json()

    assert "items" in result
    returned_titles = {item["title"] for item in result["items"]}
    assert len(result["items"]) == 1
    assert "alpha_doc.pdf" in returned_titles, "alpha_doc.pdf should be found"

    # =================================================================
    # Search for documents owned by Team Beta
    # =================================================================
    payload = {
        "filters": {
            "owner": [
                {
                    "value": {
                        "id": str(team_beta.id),
                        "type": "group"
                    },
                    "operator": "eq"
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }
    api_client = await login_as(john)
    response = await api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()
    result = response.json()

    assert "items" in result
    returned_titles = {item["title"] for item in result["items"]}
    assert len(result["items"]) == 1
    assert "beta_doc.pdf" in returned_titles, "beta_doc.pdf should be found"
