from tests.conftest import client

PROPERTY_PAYLOAD = {
    "address": "Rua das Flores, 123",
    "cep": "01001-000",
    "kind": "apartment",
    "status": "available"
}

def test_create_property(auth_headers):
    response = client.post("/property/register", json=PROPERTY_PAYLOAD, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["address"] == "Rua das Flores, 123"

def test_create_property_no_auth():
    response = client.post("/property/register", json=PROPERTY_PAYLOAD)
    assert response.status_code == 401

def test_get_all_properties(auth_headers):
    client.post("/property/register", json=PROPERTY_PAYLOAD, headers=auth_headers)
    client.post("/property/register", json=PROPERTY_PAYLOAD, headers=auth_headers)

    response = client.get("/property/get/all", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["items"]) == 2

def test_get_property_by_id(auth_headers, created_property):
    property_id = created_property["id"]
    response = client.get(f"/property/get/id/{property_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == property_id

def test_get_property_not_found(auth_headers):
    response = client.get("/property/get/id/9999", headers=auth_headers)
    assert response.status_code == 404

def test_get_property_by_status(auth_headers, created_property):
    response = client.get("/property/get/status/available", headers=auth_headers)
    assert response.status_code == 200
    assert all(p["status"] == "available" for p in response.json()["items"])

def test_update_property_put(auth_headers, created_property):
    property_id = created_property["id"]
    payload = {
        "address": "Avenida Central, 999",
        "cep": "02002-000",
        "kind": "house",
        "status": "rented"
    }

    response = client.put(f"/property/update/put/{property_id}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["address"] == "Avenida Central, 999"

def test_update_property_patch(auth_headers, created_property):
    property_id = created_property["id"]
    response = client.patch(f"/property/update/patch/{property_id}", json={"status": "maintenance"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "maintenance"

def test_delete_property(auth_headers, created_property):
    property_id = created_property["id"]
    response = client.delete(f"/property/delete/{property_id}", headers=auth_headers)
    assert response.status_code == 204

    check = client.get(f"/property/get/id/{property_id}", headers=auth_headers)
    assert check.status_code == 404

def test_other_landlord_cant_see(auth_headers_other, created_property):
    property_id = created_property["id"]
    response = client.get(f"/property/get/id/{property_id}", headers=auth_headers_other)
    assert response.status_code == 404

def test_other_landlord_cant_delete(auth_headers_other, created_property):
    property_id = created_property["id"]
    response = client.delete(f"/property/delete/{property_id}", headers=auth_headers_other)
    assert response.status_code == 404

def test_create_property_with_extra_data(auth_headers):
    payload = {**PROPERTY_PAYLOAD, "kind": "warehouse", "extra_data": {"pe_direito_m": 9, "docas": 4}}
    response = client.post("/property/register", json=payload, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["extra_data"] == {"pe_direito_m": 9, "docas": 4}

def test_property_extra_data_defaults_to_none(created_property):
    assert created_property["extra_data"] is None

def test_update_property_put_extra_data(auth_headers, created_property):
    payload = {**PROPERTY_PAYLOAD, "extra_data": {"condominio": 450.0}}
    response = client.put(f"/property/update/put/{created_property['id']}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["extra_data"] == {"condominio": 450.0}

def test_filter_property_by_kind_and_status(auth_headers):
    client.post("/property/register", json=PROPERTY_PAYLOAD, headers=auth_headers)
    client.post("/property/register", json={**PROPERTY_PAYLOAD, "kind": "house", "status": "rented"}, headers=auth_headers)

    response = client.get("/property/get/all?kind=house", headers=auth_headers)
    assert [p["kind"] for p in response.json()["items"]] == ["house"]

    response = client.get("/property/get/all?kind=house&status=available", headers=auth_headers)
    assert response.json()["items"] == []

def test_filter_property_by_address(auth_headers):
    client.post("/property/register", json=PROPERTY_PAYLOAD, headers=auth_headers)
    client.post("/property/register", json={**PROPERTY_PAYLOAD, "address": "Avenida Brasil, 10"}, headers=auth_headers)
    response = client.get("/property/get/all?address=brasil", headers=auth_headers)
    assert len(response.json()["items"]) == 1
