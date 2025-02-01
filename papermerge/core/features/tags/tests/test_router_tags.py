import uuid

from sqlalchemy import func

from papermerge.core.db.engine import Session
from papermerge.core import orm, schema
from papermerge.core.tests.types import AuthTestClient
from papermerge.core.features.nodes.db import api as nodes_dbapi


def test_create_tag_route(auth_api_client: AuthTestClient, db_session: Session):
    count_before = db_session.query(func.count(orm.Tag.id)).scalar()
    assert count_before == 0

    response = auth_api_client.post(
        "/tags/",
        json={"name": "important"},
    )

    assert response.status_code == 201, response.json()
    count_after = db_session.query(func.count(orm.Tag.id)).scalar()
    assert count_after == 1


def test_update_tag_route(auth_api_client: AuthTestClient, make_tag, user):
    tag: schema.Tag = make_tag(name="draft", bg_color="red", user=user)

    response = auth_api_client.patch(
        f"/tags/{tag.id}",
        # only `name` attr is being updated
        json={"name": "draft-updated"},
    )

    assert response.status_code == 200, response.json()
    with Session() as s:
        updated_tag = s.get(orm.Tag, tag.id)

    # `name` attribute was updated
    assert updated_tag.name == "draft-updated"
    # other attributes did not change
    assert updated_tag.bg_color == tag.bg_color
    assert updated_tag.fg_color == tag.fg_color


def test_get_tag_route(auth_api_client: AuthTestClient, make_tag, user):
    tag: schema.Tag = make_tag(name="draft", bg_color="red", user=user)

    response = auth_api_client.get(
        f"/tags/{tag.id}",
    )

    assert response.status_code == 200, response.json()


def test_get_non_existing_tag(auth_api_client: AuthTestClient, make_tag, user):
    """
    In this use case valid UUID is passed - however there is no tag
    with such UUID
    """

    response = auth_api_client.get(
        f"/tags/{uuid.uuid4()}",
    )

    assert response.status_code == 404, response.json()


def test_delete_tag_route(auth_api_client: AuthTestClient, db_session, make_tag, user):
    tag: schema.Tag = make_tag(name="draft", bg_color="red", user=user)

    response = auth_api_client.delete(
        f"/tags/{tag.id}",
    )

    assert response.status_code == 204
    tags_count = db_session.query(func.count(orm.Tag.id)).scalar()
    assert tags_count == 0


def test_tags_paginated_result__8_items_first_page(
    make_tag, auth_api_client: AuthTestClient, user
):
    total_tags = 8
    for i in range(total_tags):
        make_tag(name=f"Tag {i}", user=user)

    params = {"page_size": 5, "page_number": 1}
    response = auth_api_client.get("/tags/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.Tag](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5


def test_get_all_tags_no_pagination(make_tag, auth_api_client: AuthTestClient, user):
    total_tags = 8
    for i in range(total_tags):
        make_tag(name=f"Tag {i}", user=user)

    response = auth_api_client.get("/tags/all")

    assert response.status_code == 200, response.json()

    items = [schema.Tag(**item) for item in response.json()]

    assert len(items) == 8


def test_get_all_tags_no_pagination_per_user(make_tag, make_api_client):
    """
    Tags are per user. In other words, each user can create and thus
    own his/her tags. By default, i.e. without explicit sharing,
    each user will be able to list/view only his/her tags.

    In this scenario:

        * User A has 5 tags
        * User B has 8 tags

    Then, by default, user A will get only his/her tags (and user B, his/her)
    """
    client_a: AuthTestClient = make_api_client(username="user A")
    client_b: AuthTestClient = make_api_client(username="user B")

    user_a_tags_count = 5
    for i in range(user_a_tags_count):
        make_tag(name=f"Tag {i}", user=client_a.user)

    user_b_tags_count = 8
    for i in range(user_b_tags_count):
        make_tag(name=f"Tag {i}", user=client_b.user)

    # Client B / User B
    response = client_a.get("/tags/all")

    assert response.status_code == 200, response.json()
    items_user_a = [schema.Tag(**item) for item in response.json()]

    assert len(items_user_a) == user_a_tags_count

    # Client B / User B
    response = client_b.get("/tags/all")
    assert response.status_code == 200, response.json()
    items_user_b = [schema.Tag(**item) for item in response.json()]

    assert len(items_user_b) == user_b_tags_count


def test_delete_tag_which_has_associated_folder(
    make_folder, make_tag, db_session, user, auth_api_client
):
    folder = make_folder(title="My Documents", user=user, parent=user.home_folder)
    tag = make_tag(name="important", user=user)

    nodes_dbapi.assign_node_tags(
        db_session,
        node_id=folder.id,
        tags=["important"],
        user_id=user.id,
    )

    # delete tagged folder
    response = auth_api_client.delete(f"/tags/{tag.id}")

    assert response.status_code == 204

    # folder still exists
    q = db_session.query(orm.Folder).filter(orm.Folder.id == folder.id)
    assert db_session.query(q.exists()).scalar() is True

    # but tag was deleted
    q_tag = db_session.query(orm.Tag).filter(orm.Tag.name == "important")
    assert db_session.query(q_tag.exists()).scalar() is False


def test_delete_tag_which_has_associated_document(
    make_document, make_tag, db_session, user, auth_api_client
):
    doc = make_document(title="My Contract", user=user, parent=user.home_folder)
    tag = make_tag(name="important", user=user)

    nodes_dbapi.assign_node_tags(
        db_session,
        node_id=doc.id,
        tags=["important"],
        user_id=user.id,
    )

    # delete tagged folder
    response = auth_api_client.delete(f"/tags/{tag.id}")

    assert response.status_code == 204

    # document still exists
    q = db_session.query(orm.Document).filter(orm.Document.id == doc.id)
    assert db_session.query(q.exists()).scalar() is True

    # but tag was deleted
    q_tag = db_session.query(orm.Tag).filter(orm.Tag.name == "important")
    assert db_session.query(q_tag.exists()).scalar() is False
