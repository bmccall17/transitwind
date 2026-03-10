# ADR 010: Stateless Token Refresh

**Status:** accepted
**Date:** 2026-03-10

## Context

JWT tokens expire after 7 days. Once expired, the user is logged out with no way to extend the session. Common solutions include:

1. **Refresh token table** — store a long-lived refresh token in DB, issue new access tokens against it
2. **Sliding window** — reissue a fresh access token from a still-valid access token
3. **Session store** — server-side sessions with Redis or DB

TransitWind is a single-user app running on SQLite. Adding a refresh token table or session store adds complexity without proportional benefit.

## Decision

Use stateless token refresh: `POST /api/auth/refresh` accepts a valid (non-expired) JWT and returns a new JWT with a fresh expiry. No database state is involved in the refresh itself — only the standard `get_current_user` dependency validates the token and confirms the user still exists.

The frontend calls `/auth/refresh` on app mount to silently extend the session. On 401, it clears the token and redirects to login.

## Consequences

- **Simple**: No refresh token table, no token rotation logic, no revocation list
- **Stateless**: Refresh is just re-signing — scales trivially
- **Limitation**: Cannot refresh after expiry. If the user doesn't open the app for 7+ days, they must log in again. Acceptable for a daily-use personal app.
- **Limitation**: No server-side revocation. A stolen token is valid until expiry. Mitigated by short-ish expiry (7 days) and single-user context.
- **Scaling note**: If multi-user support is added, consider rotating refresh tokens with DB-backed revocation.
