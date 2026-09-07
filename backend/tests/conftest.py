from dotenv import load_dotenv
load_dotenv('.env.test', override=True)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
import os
from app.database import get_db, engine, Base
from app.main import app
from app.routes.landlord import create_landlord, login

engine = create_engine(os.getenv("DATABASE_URL_TEST"))
client = TestClient(app)

@pytest.fixture(autouse=True)
def create_tables():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()

SessionTest = sessionmaker(bind=engine)

def override_get_db():
    db = SessionTest()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture
def auth_headers():
    client.post("/auth/register", json={"name": "roberto", "email": "roberto123@gmail.com", "password": "123456"})
    response = client.post("/auth/login", data={"username": "roberto123@gmail.com", "password": "123456"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_other():
    client.post("/auth/register", json={"name": "carla", "email": "carla456@gmail.com", "password": "123456"})
    response = client.post("/auth/login", data={"username": "carla456@gmail.com", "password": "123456"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def created_property(auth_headers):
    payload = {
        "address": "Rua das Flores, 123",
        "cep": "01001-000",
        "kind": "apartment",
        "status": "available"
    }
    response = client.post("/property/register", json=payload, headers=auth_headers)
    return response.json()

@pytest.fixture
def created_client(auth_headers):
    payload = {
        "name": "Fernanda Souza",
        "cpf": "123.456.789-00",
        "email": "fernanda@gmail.com",
        "phone": "11999998888"
    }
    response = client.post("/client/register", json=payload, headers=auth_headers)
    return response.json()