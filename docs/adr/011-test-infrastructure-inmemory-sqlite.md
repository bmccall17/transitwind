# ADR 011: Test Infrastructure with In-Memory SQLite

**Status:** accepted
**Date:** 2026-03-10

## Context

TransitWind had zero backend tests. We needed a test strategy that:

- Runs fast (< 10s for full suite)
- Tests real FastAPI endpoints end-to-end (not just unit tests)
- Isolates tests from each other and from the production database
- Requires minimal setup (no Docker, no external services)

## Decision

Use pytest + FastAPI's `TestClient` with an in-memory SQLite database:

- **`conftest.py`** creates a `StaticPool` in-memory SQLite engine shared across threads
- **`db` fixture** creates all tables before each test and drops them after, ensuring full isolation
- **`client` fixture** overrides FastAPI's `get_db` dependency to inject the test session
- **`seed_user` / `auth_headers` fixtures** handle registration and auth for tests that need an authenticated user
- **`seed_chart` fixture** creates a natal chart with known birth data

Tests hit real HTTP endpoints through `TestClient`, exercising the full request/response cycle including middleware, dependency injection, and database operations.

## Consequences

- **Fast**: 22 tests run in ~5 seconds, no I/O bottleneck
- **Isolated**: Each test gets a fresh database — no state leakage
- **Realistic**: Tests exercise the full stack (router → service → DB), catching integration bugs that unit tests miss
- **No external deps**: No Docker, no test database server, no cleanup scripts
- **Limitation**: In-memory SQLite may behave slightly differently from file-based SQLite in edge cases (e.g., concurrent writes). Acceptable since TransitWind is single-user.
- **Limitation**: `seed()` from `main.py` startup doesn't run in tests (no env vars set), which is correct — tests manage their own state via fixtures.
