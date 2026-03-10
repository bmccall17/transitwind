"""Tests for user profile CRUD: get, update, change password, delete."""

from backend.tests.conftest import SEED_EMAIL, SEED_PASSWORD, SEED_NAME


def test_get_me(client, auth_headers):
    res = client.get("/api/user/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == SEED_EMAIL
    assert data["name"] == SEED_NAME
    assert data["has_chart"] is False


def test_get_me_with_chart(client, auth_headers, seed_chart):
    res = client.get("/api/user/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["has_chart"] is True


def test_update_name(client, auth_headers):
    res = client.put("/api/user/me", json={"name": "Updated Name"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Name"

    # Verify persistence
    res = client.get("/api/user/me", headers=auth_headers)
    assert res.json()["name"] == "Updated Name"


def test_update_email(client, auth_headers):
    res = client.put("/api/user/me", json={"email": "newemail@example.com"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "newemail@example.com"


def test_update_email_duplicate(client, auth_headers):
    # Register another user
    client.post("/api/auth/register", json={
        "email": "taken@example.com",
        "password": "pass123",
    })
    # Try to change to that email
    res = client.put("/api/user/me", json={"email": "taken@example.com"}, headers=auth_headers)
    assert res.status_code == 400
    assert "already" in res.json()["detail"].lower()


def test_change_password(client, auth_headers):
    res = client.post("/api/user/change-password", json={
        "old_password": SEED_PASSWORD,
        "new_password": "newpassword456",
    }, headers=auth_headers)
    assert res.status_code == 200

    # Verify can login with new password
    res = client.post("/api/auth/login", json={
        "email": SEED_EMAIL,
        "password": "newpassword456",
    })
    assert res.status_code == 200

    # Verify old password no longer works
    res = client.post("/api/auth/login", json={
        "email": SEED_EMAIL,
        "password": SEED_PASSWORD,
    })
    assert res.status_code == 401


def test_change_password_wrong_old(client, auth_headers):
    res = client.post("/api/user/change-password", json={
        "old_password": "wrongoldpass",
        "new_password": "newpassword456",
    }, headers=auth_headers)
    assert res.status_code == 400


def test_delete_account(client, auth_headers, seed_chart):
    # Create a journal entry too
    client.post("/api/journal", json={"content": "test entry"}, headers=auth_headers)

    res = client.delete("/api/user/me", headers=auth_headers)
    assert res.status_code == 200

    # Verify user is gone — can't login
    res = client.post("/api/auth/login", json={
        "email": SEED_EMAIL,
        "password": SEED_PASSWORD,
    })
    assert res.status_code == 401

    # Verify token no longer works
    res = client.get("/api/user/me", headers=auth_headers)
    assert res.status_code == 401
