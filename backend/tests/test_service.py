from tests.conftest import client

def service_payload(property_id, **overrides):
    payload = {
        "property_id": property_id,
        "name": "Troca de fechadura",
        "description": "Fechadura da porta principal com defeito",
        "value": 250.0,
        "status": "pending"
    }
    payload.update(overrides)
    return payload

def test_create_service(auth_headers, created_property):
    payload = service_payload(created_property["id"])
    response = client.post("/service/register", json=payload, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["name"] == "Troca de fechadura"

def test_create_service_invalid_property(auth_headers):
    payload = service_payload(property_id=9999)
    response = client.post("/service/register", json=payload, headers=auth_headers)
    assert response.status_code == 404

def test_get_all_services(auth_headers, created_property):
    client.post("/service/register", json=service_payload(created_property["id"]), headers=auth_headers)
    response = client.get("/service/get/all", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_get_service_by_id(auth_headers, created_property):
    created = client.post("/service/register", json=service_payload(created_property["id"]), headers=auth_headers).json()
    response = client.get(f"/service/get/id/{created['id']}", headers=auth_headers)
    assert response.status_code == 200

def test_get_service_by_status(auth_headers, created_property):
    client.post("/service/register", json=service_payload(created_property["id"]), headers=auth_headers)
    response = client.get("/service/get/status/pending", headers=auth_headers)
    assert response.status_code == 200
    assert all(s["status"] == "pending" for s in response.json())

def test_get_services_by_property(auth_headers, created_property):
    client.post("/service/register", json=service_payload(created_property["id"]), headers=auth_headers)
    response = client.get(f"/service/get/property/{created_property['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_get_services_by_property_status(auth_headers, created_property):
    client.post("/service/register", json=service_payload(created_property["id"]), headers=auth_headers)
    response = client.get(
        f"/service/get/property/{created_property['id']}/status/pending",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_update_service_put(auth_headers, created_property):
    created = client.post("/service/register", json=service_payload(created_property["id"]), headers=auth_headers).json()
    payload = service_payload(created_property["id"], name="Reparo hidráulico", value=400.0)

    response = client.put(f"/service/update/put/{created['id']}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Reparo hidráulico"

def test_update_service_patch(auth_headers, created_property):
    created = client.post("/service/register", json=service_payload(created_property["id"]), headers=auth_headers).json()
    response = client.patch(f"/service/update/patch/{created['id']}", json={"status": "completed"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "completed"

def test_delete_service(auth_headers, created_property):
    created = client.post("/service/register", json=service_payload(created_property["id"]), headers=auth_headers).json()
    response = client.delete(f"/service/delete/{created['id']}", headers=auth_headers)
    assert response.status_code == 204

    check = client.get(f"/service/get/id/{created['id']}", headers=auth_headers)
    assert check.status_code == 404

def test_other_landlord_cant_see(auth_headers, auth_headers_other, created_property):
    created = client.post("/service/register", json=service_payload(created_property["id"]), headers=auth_headers).json()
    response = client.get(f"/service/get/id/{created['id']}", headers=auth_headers_other)
    assert response.status_code == 404