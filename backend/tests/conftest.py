from dotenv import load_dotenv
load_dotenv('.env.test', override=True)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
import os
from backend.app.database import get_db, engine, Base
from backend.app.main import app
from backend.app.routes.landlord import create_landlord, login

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
