from tests.conftest import client

def test_register():
    payload = {
        "name": "roberto", 
        "email": "roberto123@gmail.com", 
        "password": "123456"
    }
    
    response = client.post("/auth/register", json=payload)
    
    assert response.status_code == 201

def test_login():
    client.post("/auth/register", json={"name": "roberto", "email": "roberto123@gmail.com", "password": "123456"})
    response = client.post("/auth/login", data={"username": "roberto123@gmail.com", "password": "123456"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_me(auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "roberto123@gmail.com"

def test_me_without_token():
    response = client.get("/auth/me")
    assert response.status_code == 401
