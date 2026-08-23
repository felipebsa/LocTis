from tests.conftest import client

def test_register():
    payload = {
        "name": "roberto", 
        "email": "roberto123@gmail.com", 
        "password": "123456"
    }
    
    response = client.post("/auth/register", json=payload)
    
    assert response.status_code == 201