from tests.conftest import client

def note_payload(entity_type, entity_id, content="Inquilino pediu pintura nova"):
    return {"entity_type": entity_type, "entity_id": entity_id, "content": content}

def test_create_note_on_property(auth_headers, created_property):
    response = client.post("/note/register", json=note_payload("property", created_property["id"]), headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["entity_type"] == "property"
    assert body["entity_id"] == created_property["id"]

def test_create_note_on_client(auth_headers, created_client):
    response = client.post("/note/register", json=note_payload("client", created_client["id"]), headers=auth_headers)
    assert response.status_code == 201

def test_create_note_on_service(auth_headers, created_property):
    service = client.post("/service/register", json={
        "property_id": created_property["id"], "name": "Pintura", "description": "Sala", "value": 300.0, "status": "pending"
    }, headers=auth_headers).json()
    response = client.post("/note/register", json=note_payload("service", service["id"]), headers=auth_headers)
    assert response.status_code == 201

def test_create_note_on_contract(auth_headers, created_property, created_client):
    contract = client.post("/contract/register", json={
        "property_id": created_property["id"], "client_id": created_client["id"], "value": 1500.0,
        "start_date": "2026-01-01T00:00:00", "end_date": "2026-12-31T00:00:00", "status": "active", "extra_data": None
    }, headers=auth_headers).json()
    response = client.post("/note/register", json=note_payload("contract", contract["id"]), headers=auth_headers)
    assert response.status_code == 201

def test_create_note_entity_not_found(auth_headers):
    response = client.post("/note/register", json=note_payload("property", 9999), headers=auth_headers)
    assert response.status_code == 404

def test_create_note_on_other_landlord_entity(auth_headers_other, created_property):
    response = client.post("/note/register", json=note_payload("property", created_property["id"]), headers=auth_headers_other)
    assert response.status_code == 404

def test_create_note_invalid_type(auth_headers, created_property):
    response = client.post("/note/register", json=note_payload("banana", created_property["id"]), headers=auth_headers)
    assert response.status_code == 422

def test_create_note_empty_content(auth_headers, created_property):
    response = client.post("/note/register", json=note_payload("property", created_property["id"], content=""), headers=auth_headers)
    assert response.status_code == 422

def test_note_same_id_different_type_is_distinct(auth_headers, created_property, created_client):
    # property e client podem ter o mesmo id numérico: a nota deve ser vinculada ao tipo certo
    client.post("/note/register", json=note_payload("property", created_property["id"], "da propriedade"), headers=auth_headers)
    client.post("/note/register", json=note_payload("client", created_client["id"], "do cliente"), headers=auth_headers)

    props = client.get(f"/note/get/entity/property/{created_property['id']}", headers=auth_headers).json()["items"]
    assert [n["content"] for n in props] == ["da propriedade"]

def test_get_notes_by_entity(auth_headers, created_property):
    client.post("/note/register", json=note_payload("property", created_property["id"], "primeira"), headers=auth_headers)
    client.post("/note/register", json=note_payload("property", created_property["id"], "segunda"), headers=auth_headers)
    response = client.get(f"/note/get/entity/property/{created_property['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert [n["content"] for n in response.json()["items"]] == ["primeira", "segunda"]

def test_get_all_notes_with_filter(auth_headers, created_property, created_client):
    client.post("/note/register", json=note_payload("property", created_property["id"]), headers=auth_headers)
    client.post("/note/register", json=note_payload("client", created_client["id"]), headers=auth_headers)

    assert len(client.get("/note/get/all", headers=auth_headers).json()["items"]) == 2
    only_clients = client.get("/note/get/all?entity_type=client", headers=auth_headers).json()["items"]
    assert [n["entity_type"] for n in only_clients] == ["client"]

def test_get_note_by_id(auth_headers, created_property):
    created = client.post("/note/register", json=note_payload("property", created_property["id"]), headers=auth_headers).json()
    response = client.get(f"/note/get/id/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]

def test_update_note(auth_headers, created_property):
    created = client.post("/note/register", json=note_payload("property", created_property["id"]), headers=auth_headers).json()
    response = client.put(f"/note/update/put/{created['id']}", json={"content": "editada"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["content"] == "editada"

def test_delete_note(auth_headers, created_property):
    created = client.post("/note/register", json=note_payload("property", created_property["id"]), headers=auth_headers).json()
    assert client.delete(f"/note/delete/{created['id']}", headers=auth_headers).status_code == 204
    assert client.get(f"/note/get/id/{created['id']}", headers=auth_headers).status_code == 404

def test_other_landlord_cant_see_note(auth_headers, auth_headers_other, created_property):
    created = client.post("/note/register", json=note_payload("property", created_property["id"]), headers=auth_headers).json()
    assert client.get(f"/note/get/id/{created['id']}", headers=auth_headers_other).status_code == 404
    assert client.put(f"/note/update/put/{created['id']}", json={"content": "x"}, headers=auth_headers_other).status_code == 404
    assert client.delete(f"/note/delete/{created['id']}", headers=auth_headers_other).status_code == 404
    assert client.get("/note/get/all", headers=auth_headers_other).json()["items"] == []

def test_deleting_entity_deletes_its_notes(auth_headers, created_client):
    created = client.post("/note/register", json=note_payload("client", created_client["id"]), headers=auth_headers).json()
    client.delete(f"/client/delete/{created_client['id']}", headers=auth_headers)
    assert client.get(f"/note/get/id/{created['id']}", headers=auth_headers).status_code == 404

def test_note_requires_auth():
    assert client.post("/note/register", json=note_payload("property", 1)).status_code == 401
