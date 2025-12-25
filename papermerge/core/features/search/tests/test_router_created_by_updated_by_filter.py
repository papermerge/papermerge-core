from core.features.document.schema import DocumentLang
from papermerge.core import db, orm, types
from papermerge.core.features.ownership.db.api import set_owners


async def test_very_basic_created_by_filtering(
    login_as,
    db_session: db.AsyncSession,
    make_user,
    make_group,
    make_document,
    system_user
):
    team: orm.Group = await make_group("The Team")
    john: orm.User = await make_user("john")
    luke: orm.User = await make_user("luke")
    user_group1 = orm.UserGroup(
        user=john,
        group=team,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    user_group2 = orm.UserGroup(
        user=luke,
        group=team,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
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
    api_client = await login_as(john)
    response = await api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()
    result = response.json()

    assert "items" in result
    returned_titles = {item["title"] for item in result["items"]}
    assert len(result["items"]) == 1
    assert "john.pdf" in returned_titles, "john.pdf should be found"

    # Without any filter, both documents are accessible
    response = await api_client.post("/search/", json={})

    assert response.status_code == 200, response.json()
    result = response.json()

    assert "items" in result
    returned_titles = {item["title"] for item in result["items"]}
    # without filters both docs are accessible
    assert len(result["items"]) == 2
    assert "john.pdf" in returned_titles, "john.pdf should be found"
    assert "luke.pdf" in returned_titles, "luke.pdf should be found"


async def test_very_basic_updated_by_filtering(
    login_as,
    db_session: db.AsyncSession,
    make_user,
    make_group,
    make_document,
    system_user
):
    # =================================================================
    # Create a Group of 3 users: john, luke and diana.
    # =================================================================
    team: orm.Group = await make_group("The Team")
    john: orm.User = await make_user("john")
    luke: orm.User = await make_user("luke")
    diana: orm.User = await make_user("diana")
    user_group1 = orm.UserGroup(
        user=john,
        group=team,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    user_group2 = orm.UserGroup(
        user=luke,
        group=team,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    user_group3 = orm.UserGroup(
        user=diana,
        group=team,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    db_session.add_all([user_group1, user_group2, user_group3])
    await db_session.commit()

    doc1 = await make_document(
        title="john.pdf",
        user=john,
        parent=john.home_folder,
        lang=DocumentLang.eng
    )
    doc2 = await make_document(
        title="luke.pdf",
        user=luke,
        parent=luke.home_folder,
        lang=DocumentLang.eng
    )

    owner = types.Owner.create_from(group_id=team.id)
    # =================================================================
    # The group owns 2 documents john.pdf (created by john) and luke.pdf
    # (created by luke)
    # =================================================================
    await set_owners(
        session=db_session,
        resource_type=types.ResourceType.NODE,
        resource_ids=[doc1.id, doc2.id],
        owner=owner
    )

    # =================================================================
    # Diana updates the document (i.e. updates last document version)
    # =================================================================
    doc_ver = await db.get_last_doc_ver(db_session=db_session, doc_id=doc1.id)
    diana_api_client = await login_as(diana)
    response = await diana_api_client.patch(
        f"/document-versions/{doc_ver.id}/lang",
        json={"lang": "fra"}
    )
    assert response.status_code == 200, response.json()

    payload = {
        "filters": {
            "updated_by": [
                {
                    "value": str(diana.id)
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }
    # =================================================================
    # John searches for all documents updated by Diana
    # =================================================================
    john_api_client = await login_as(john)
    response = await john_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()
    result = response.json()

    assert "items" in result
    returned_titles = {item["title"] for item in result["items"]}
    assert len(result["items"]) == 1
    assert "john.pdf" in returned_titles, "john.pdf should be found"

    # Without any filter, both documents should be returned
    response = await john_api_client.post("/search/", json={})

    assert response.status_code == 200, response.json()
    result = response.json()

    assert "items" in result
    returned_titles = {item["title"] for item in result["items"]}
    # without filters both docs should be returned
    assert len(result["items"]) == 2
    assert "john.pdf" in returned_titles, "john.pdf should be found"
    assert "luke.pdf" in returned_titles, "luke.pdf should be found"
