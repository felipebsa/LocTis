from tests.conftest import client

CLIENT_PAYLOAD = {
    "name": "Fernanda Souza",
    "cpf": "12345678900",
    "email": "fernanda@gmail.com",
    "phone": "11999998888"
}

def test_create_client(auth_headers):
    response = client.post("/client/register", json=CLIENT_PAYLOAD, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["name"] == "Fernanda Souza"

def test_get_all_clients(auth_headers):
    client.post("/client/register", json=CLIENT_PAYLOAD, headers=auth_headers)
    response = client.get("/client/get/all", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["items"]) == 1

def test_get_client_by_id(auth_headers, created_client):
    client_id = created_client["id"]
    response = client.get(f"/client/get/id/{client_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == client_id

def test_get_client_not_found(auth_headers):
    response = client.get("/client/get/id/9999", headers=auth_headers)
    assert response.status_code == 404

def test_update_client(auth_headers, created_client):
    client_id = created_client["id"]
    payload = {
        "name": "Fernanda Souza Lima",
        "cpf": "12345678900",
        "email": "fernanda.lima@gmail.com",
        "phone": "11988887777"
    }

    response = client.put(f"/client/update/put/{client_id}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Fernanda Souza Lima"

def test_delete_client(auth_headers, created_client):
    client_id = created_client["id"]
    response = client.delete(f"/client/delete/{client_id}", headers=auth_headers)
    assert response.status_code == 204

    check = client.get(f"/client/get/id/{client_id}", headers=auth_headers)
    assert check.status_code == 404

def test_other_landlord_cant_see(auth_headers_other, created_client):
    client_id = created_client["id"]
    response = client.get(f"/client/get/id/{client_id}", headers=auth_headers_other)
    assert response.status_code == 404

def test_create_client_without_email_and_phone(auth_headers):
    response = client.post("/client/register", json={"name": "Sem Contato", "cpf": "98765432100"}, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["email"] is None
    assert response.json()["phone"] is None

    listing = client.get("/client/get/all", headers=auth_headers)
    assert listing.status_code == 200

def test_create_client_duplicate_cpf(auth_headers, created_client):
    response = client.post("/client/register", json=CLIENT_PAYLOAD, headers=auth_headers)
    assert response.status_code == 409

def test_create_client_invalid_cpf_length(auth_headers):
    response = client.post("/client/register", json={**CLIENT_PAYLOAD, "cpf": "123"}, headers=auth_headers)
    assert response.status_code == 422

def test_filter_client_by_name(auth_headers):
    client.post("/client/register", json=CLIENT_PAYLOAD, headers=auth_headers)
    client.post("/client/register", json={"name": "Joao Silva", "cpf": "11122233344"}, headers=auth_headers)
    response = client.get("/client/get/all?name=fernanda", headers=auth_headers)
    assert [c["name"] for c in response.json()["items"]] == ["Fernanda Souza"]
