import pytest
from fastapi.testclient import TestClient
from papermerge.core.models import User
from papermerge.core.types import PaginatedResponse
from papermerge.core import schemas
from papermerge.test.baker_recipes import folder_recipe
from typing import Union
from papermerge.test.types import AuthTestClient


@pytest.mark.django_db(transaction=True)
def test_initial_users_home_folder_is_empty(montaigne: User, api_client: TestClient):
    parent_id = montaigne.home_folder.id
    response = api_client.get(
        f"/nodes/{parent_id}",
        headers={
            'Remote-User': 'montaigne'
        }
    )
    assert response.status_code == 200

    data = PaginatedResponse[Union[schemas.Document, schemas.Folder]](
        **response.json()
    )
    assert data.items == []


@pytest.mark.django_db(transaction=True)
def test_basic_sorting_by_title(auth_api_client: AuthTestClient):
    """
    Tests very basic sorting. In this test sorting by title:

        GET /nodes/parent_id?oder_by=title    (1)
        GET /nodes/parent_id?oder_by=-title   (2)

    (1) Must return items sorted asc by title
    (2) Must return items sorted desc by title
    """
    home = auth_api_client.user.home_folder
    for title in ('A', 'B'):
        folder_recipe.make(
            title=title,
            user=auth_api_client.user,
            parent=home
        )

    # Check "ASC" part; first returned item must be A, and second B
    response = auth_api_client.get(f"/nodes/{home.id}?order_by=title")
    data = PaginatedResponse[Union[schemas.Document, schemas.Folder]](
        **response.json()
    )
    assert len(data.items) == 2
    assert data.items[0].title == "A"
    assert data.items[1].title == "B"

    # Check "DESC" part; first returned item must be B, and second A
    response = auth_api_client.get(f"/nodes/{home.id}?order_by=-title")
    data = PaginatedResponse[Union[schemas.Document, schemas.Folder]](
        **response.json()
    )
    assert len(data.items) == 2
    assert data.items[0].title == "B"
    assert data.items[1].title == "A"
