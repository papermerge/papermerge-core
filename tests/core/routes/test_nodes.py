import pytest
from fastapi.testclient import TestClient

from papermerge.core import schemas
from papermerge.core.models import User
from papermerge.core.types import PaginatedResponse
from papermerge.test.types import AuthTestClient


@pytest.mark.django_db(transaction=True)
def test_initial_users_home_folder_is_empty(montaigne: User, api_client: TestClient):
    parent_id = montaigne.home_folder.id
    response = api_client.get(
        f"/nodes/{parent_id}", headers={"Remote-User": "montaigne"}
    )
    assert response.status_code == 200

    data = PaginatedResponse[schemas.Document | schemas.Folder](**response.json())
    assert data.items == []


@pytest.mark.django_db(transaction=True)
def test_basic_sorting_by_title(auth_api_client: AuthTestClient, make_folder):
    """
    Tests very basic sorting. In this test sorting by title:

        GET /nodes/parent_id?oder_by=title    (1)
        GET /nodes/parent_id?oder_by=-title   (2)

    (1) Must return items sorted asc by title
    (2) Must return items sorted desc by title
    """
    home = auth_api_client.user.home_folder
    for title in ("A", "B"):
        make_folder(title=title, user=auth_api_client.user, parent=home)

    # Check "ASC" part; first returned item must be A, and second B
    response = auth_api_client.get(f"/nodes/{home.id}?order_by=title")
    data = PaginatedResponse[schemas.Document | schemas.Folder](**response.json())
    assert len(data.items) == 2
    assert data.items[0].title == "A"
    assert data.items[1].title == "B"

    # Check "DESC" part; first returned item must be B, and second A
    response = auth_api_client.get(f"/nodes/{home.id}?order_by=-title")
    data = PaginatedResponse[schemas.Document | schemas.Folder](**response.json())
    assert len(data.items) == 2
    assert data.items[0].title == "B"
    assert data.items[1].title == "A"


@pytest.mark.django_db(transaction=True)
def test_basic_sorting_by_ctype(
    auth_api_client: AuthTestClient, make_folder, make_document
):
    """
    Tests very basic sorting. In this test sorting by ctype:

        GET /nodes/parent_id?oder_by=ctype    (1)
        GET /nodes/parent_id?oder_by=-ctype   (2)

    (1) Must return items sorted asc by ctype
    (2) Must return items sorted desc by ctype
    """
    home = auth_api_client.user.home_folder
    make_folder(title="A", user=auth_api_client.user, parent=home)
    make_document(title="invoice.pdf", user=auth_api_client.user, parent=home)

    # Check "ASC" part; first returned document item, and second the folder
    response = auth_api_client.get(f"/nodes/{home.id}?order_by=ctype")
    data = PaginatedResponse[schemas.Document | schemas.Folder](**response.json())
    assert len(data.items) == 2
    assert data.items[0].ctype == "document"
    assert data.items[1].ctype == "folder"

    # Check "DESC" part; first returned folder item, and second the document
    response = auth_api_client.get(f"/nodes/{home.id}?order_by=-ctype")
    data = PaginatedResponse[schemas.Document | schemas.Folder](**response.json())
    assert len(data.items) == 2
    assert data.items[0].ctype == "folder"
    assert data.items[1].ctype == "document"


@pytest.mark.django_db(transaction=True)
def test_invalid_order_by(auth_api_client: AuthTestClient):
    """
    When receiving invalid `order_by` value, server must
    return 422 (unprocessable entity).
    """
    home = auth_api_client.user.home_folder

    response = auth_api_client.get(f"/nodes/{home.id}?order_by=ab")
    assert response.status_code == 422

    # less obvious example: note `order_by` has UNSUPPORTED value type
    # Do you see the problem?
    response = auth_api_client.get(
        f"/nodes/{home.id}?order_by=type"
    )  # Correct value is `ctype`
    assert response.status_code == 422
