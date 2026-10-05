from tests.conftest import client

PROPERTY_PAYLOAD = {
    "address": "Rua das Flores, 123",
    "cep": "01001-000",
    "kind": "apartment",
    "status": "available"
}

def _create_properties(headers, n):
    for i in range(n):
        client.post("/property/register", json={**PROPERTY_PAYLOAD, "address": f"Rua {i}"}, headers=headers)

def test_default_page_shape(auth_headers):
    _create_properties(auth_headers, 3)
    body = client.get("/property/get/all", headers=auth_headers).json()
    assert set(body.keys()) == {"items", "page_atual", "page_max", "total"}
    assert body["page_atual"] == 1
    assert body["page_max"] == 1
    assert len(body["items"]) == 3

def test_empty_list_has_page_max_one(auth_headers):
    body = client.get("/property/get/all", headers=auth_headers).json()
    assert body == {"items": [], "page_atual": 1, "page_max": 1, "total": 0}

def test_limit_and_page(auth_headers):
    _create_properties(auth_headers, 5)

    first = client.get("/property/get/all?limit=2&page=1", headers=auth_headers).json()
    assert len(first["items"]) == 2
    assert first["page_max"] == 3

    last = client.get("/property/get/all?limit=2&page=3", headers=auth_headers).json()
    assert len(last["items"]) == 1
    assert last["page_atual"] == 3

def test_pages_are_ordered_and_do_not_overlap(auth_headers):
    _create_properties(auth_headers, 5)
    ids = []
    for page in (1, 2, 3):
        ids += [p["id"] for p in client.get(f"/property/get/all?limit=2&page={page}", headers=auth_headers).json()["items"]]
    assert ids == sorted(ids)
    assert len(ids) == len(set(ids)) == 5

def test_page_beyond_last_returns_empty_items(auth_headers):
    _create_properties(auth_headers, 2)
    body = client.get("/property/get/all?limit=2&page=5", headers=auth_headers).json()
    assert body["items"] == []
    assert body["page_max"] == 1

def test_limit_is_capped_by_server(auth_headers):
    assert client.get("/property/get/all?limit=1000", headers=auth_headers).status_code == 422
    assert client.get("/property/get/all?limit=0", headers=auth_headers).status_code == 422
    assert client.get("/property/get/all?page=0", headers=auth_headers).status_code == 422

def test_pagination_only_counts_own_records(auth_headers, auth_headers_other):
    _create_properties(auth_headers, 3)
    body = client.get("/property/get/all", headers=auth_headers_other).json()
    assert body["items"] == []
    assert body["page_max"] == 1

def test_status_endpoint_is_paginated(auth_headers):
    _create_properties(auth_headers, 3)
    body = client.get("/property/get/status/available?limit=2", headers=auth_headers).json()
    assert len(body["items"]) == 2
    assert body["page_max"] == 2
