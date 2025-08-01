
async def test_liveness_probe(api_client):
    response = await api_client.get("/probe/")
    assert response.status_code == 200, response.json()
