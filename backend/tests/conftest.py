"""Shared test fixtures for TransitWind backend tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app

# In-memory SQLite for tests — use StaticPool so all threads share the connection
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture()
def db():
    """Create a fresh in-memory database for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client(db):
    """FastAPI test client with DB dependency override."""
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


SEED_EMAIL = "test@transitwind.dev"
SEED_PASSWORD = "testpassword123"
SEED_NAME = "Test User"


@pytest.fixture()
def seed_user(client):
    """Register a test user and return their data."""
    res = client.post("/api/auth/register", json={
        "email": SEED_EMAIL,
        "password": SEED_PASSWORD,
        "name": SEED_NAME,
    })
    assert res.status_code == 200
    return {"email": SEED_EMAIL, "password": SEED_PASSWORD, "token": res.json()["access_token"]}


@pytest.fixture()
def auth_headers(seed_user):
    """Auth headers for a registered user."""
    return {"Authorization": f"Bearer {seed_user['token']}"}


# Known birth data for testing
SEED_BIRTH_DATA = {
    "birth_datetime_utc": "1975-02-21T18:31:00",
    "birth_location": "Baton Rouge, LA, USA",
    "birth_latitude": 30.4515,
    "birth_longitude": -91.1871,
}


@pytest.fixture()
def seed_chart(client, auth_headers):
    """Create a natal chart for the test user."""
    res = client.post("/api/chart", json=SEED_BIRTH_DATA, headers=auth_headers)
    assert res.status_code == 200
    return res.json()
