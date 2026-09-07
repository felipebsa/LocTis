import pytest
from sqlalchemy.exc import IntegrityError
from tests.conftest import client

def contract_payload(property_id, client_id, **overrides):
    payload = {
        "property_id": property_id,
        "client_id": client_id,
        "value": 1500.0,
        "start_date": "2026-01-01T00:00:00",
        "end_date": "2026-12-31T00:00:00",
        "status": "active",
        "extra_data": None
    }
    payload.update(overrides)
    return payload

def test_create_contract(auth_headers, created_property, created_client):
    payload = contract_payload(created_property["id"], created_client["id"])
    response = client.post("/contract/register", json=payload, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["status"] == "active"

def test_create_contract_other_landlord_property(auth_headers_other, created_property, created_client):
    payload = contract_payload(created_property["id"], created_client["id"])
    response = client.post("/contract/register", json=payload, headers=auth_headers_other)
    assert response.status_code == 404

def test_create_contract_invalid_property(auth_headers, created_client):
    payload = contract_payload(property_id=9999, client_id=created_client["id"])
    response = client.post("/contract/register", json=payload, headers=auth_headers)
    assert response.status_code == 404

def test_get_all_contracts(auth_headers, created_property, created_client):
    payload = contract_payload(created_property["id"], created_client["id"])
    client.post("/contract/register", json=payload, headers=auth_headers)

    response = client.get("/contract/get/all", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_get_contract_by_id(auth_headers, created_property, created_client):
    payload = contract_payload(created_property["id"], created_client["id"])
    created = client.post("/contract/register", json=payload, headers=auth_headers).json()

    response = client.get(f"/contract/get/id/{created['id']}", headers=auth_headers)
    assert response.status_code == 200

def test_get_contract_by_status(auth_headers, created_property, created_client):
    payload = contract_payload(created_property["id"], created_client["id"])
    client.post("/contract/register", json=payload, headers=auth_headers)

    response = client.get("/contract/get/status/active", headers=auth_headers)
    assert response.status_code == 200
    assert all(c["status"] == "active" for c in response.json())

def test_get_contracts_by_property(auth_headers, created_property, created_client):
    payload = contract_payload(created_property["id"], created_client["id"])
    client.post("/contract/register", json=payload, headers=auth_headers)

    response = client.get(f"/contract/get/property/{created_property['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_update_contract_status(auth_headers, created_property, created_client):
    payload = contract_payload(created_property["id"], created_client["id"])
    created = client.post("/contract/register", json=payload, headers=auth_headers).json()

    response = client.patch(f"/contract/update/patch/{created['id']}", json={"status": "terminated"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "terminated"

def test_delete_contract(auth_headers, created_property, created_client):
    payload = contract_payload(created_property["id"], created_client["id"])
    created = client.post("/contract/register", json=payload, headers=auth_headers).json()

    response = client.delete(f"/contract/delete/{created['id']}", headers=auth_headers)
    assert response.status_code == 204

    check = client.get(f"/contract/get/id/{created['id']}", headers=auth_headers)
    assert check.status_code == 404

def test_other_landlord_cant_see(auth_headers, auth_headers_other, created_property, created_client):
    payload = contract_payload(created_property["id"], created_client["id"])
    created = client.post("/contract/register", json=payload, headers=auth_headers).json()

    response = client.get(f"/contract/get/id/{created['id']}", headers=auth_headers_other)
    assert response.status_code == 404

def test_invalid_dates(auth_headers, created_property, created_client):
    # falta try/except na rota, por isso o erro sobe cru
    payload = contract_payload(
        created_property["id"],
        created_client["id"],
        start_date="2026-12-31T00:00:00",
        end_date="2026-01-01T00:00:00",
    )

    with pytest.raises(IntegrityError):
        client.post("/contract/register", json=payload, headers=auth_headers)