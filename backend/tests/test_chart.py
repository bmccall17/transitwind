"""Tests for chart CRUD: create, read, update, delete."""

from backend.tests.conftest import SEED_BIRTH_DATA


def test_create_chart(client, auth_headers):
    res = client.post("/api/chart", json=SEED_BIRTH_DATA, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "type" in data
    assert "authority" in data
    assert "profile" in data
    assert "defined_gates" in data
    assert len(data["defined_gates"]) > 0


def test_get_chart(client, auth_headers, seed_chart):
    res = client.get("/api/chart", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == seed_chart["type"]
    assert data["profile"] == seed_chart["profile"]


def test_get_chart_no_chart(client, auth_headers):
    res = client.get("/api/chart", headers=auth_headers)
    assert res.status_code == 404


def test_update_chart(client, auth_headers, seed_chart):
    # Post with different birth data — should update, not create second
    different_data = {
        "birth_datetime_utc": "1990-06-15T12:00:00",
        "birth_location": "New York, NY, USA",
        "birth_latitude": 40.7128,
        "birth_longitude": -74.0060,
    }
    res = client.post("/api/chart", json=different_data, headers=auth_headers)
    assert res.status_code == 200
    updated = res.json()
    # Chart should be different from original
    # (different birth time = different chart, almost certainly different gates)
    assert updated["defined_gates"] != seed_chart["defined_gates"] or updated["profile"] != seed_chart["profile"]


def test_delete_chart(client, auth_headers, seed_chart):
    res = client.delete("/api/chart", headers=auth_headers)
    assert res.status_code == 200

    # Verify chart is gone
    res = client.get("/api/chart", headers=auth_headers)
    assert res.status_code == 404


def test_delete_chart_clears_interpretation_cache(client, auth_headers, seed_chart, db):
    """After chart deletion, cached interpretations should be cleared."""
    from backend.app.models import InterpretationCache

    # Manually insert a cached interpretation
    cache_entry = InterpretationCache(
        user_id=1,
        date_key="Sun:22:4",
        overlay_hash="Sun:22:4",
        interpretation="test interpretation",
        prompts=[],
    )
    db.add(cache_entry)
    db.commit()

    # Delete chart
    res = client.delete("/api/chart", headers=auth_headers)
    assert res.status_code == 200

    # Cache should be cleared
    remaining = db.query(InterpretationCache).filter(InterpretationCache.user_id == 1).count()
    assert remaining == 0
