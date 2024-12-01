def test_liveness_probe(api_client):
    response = api_client.get("/probe")
    assert response.status_code == 200, response.json()
