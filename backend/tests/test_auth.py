"""Tests for auth endpoints: register, login, refresh."""

from backend.tests.conftest import SEED_EMAIL, SEED_PASSWORD


def test_register_new_user(client):
    res = client.post("/api/auth/register", json={
        "email": "new@example.com",
        "password": "password123",
        "name": "New User",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client, seed_user):
    res = client.post("/api/auth/register", json={
        "email": SEED_EMAIL,
        "password": "otherpass",
    })
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


def test_login_valid(client, seed_user):
    res = client.post("/api/auth/login", json={
        "email": SEED_EMAIL,
        "password": SEED_PASSWORD,
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client, seed_user):
    res = client.post("/api/auth/login", json={
        "email": SEED_EMAIL,
        "password": "wrongpassword",
    })
    assert res.status_code == 401


def test_login_nonexistent_user(client):
    res = client.post("/api/auth/login", json={
        "email": "ghost@example.com",
        "password": "password",
    })
    assert res.status_code == 401


def test_token_refresh_valid(client, auth_headers):
    res = client.post("/api/auth/refresh", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    # Verify the new token works
    new_headers = {"Authorization": f"Bearer {data['access_token']}"}
    res2 = client.get("/api/user/me", headers=new_headers)
    assert res2.status_code == 200


def test_protected_endpoint_no_token(client):
    res = client.get("/api/user/me")
    assert res.status_code in (401, 403)  # HTTPBearer returns 403 when no credentials


def test_protected_endpoint_valid_token(client, auth_headers):
    res = client.get("/api/user/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == SEED_EMAIL
