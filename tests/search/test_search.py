import pytest
from fastapi.testclient import TestClient


@pytest.mark.django_db
def test_basic(auth_api_client: TestClient):
    response = auth_api_client.get("/search?q=one")
    assert response.status_code == 200
    assert response.json() == {"msg": "Hello World"}
