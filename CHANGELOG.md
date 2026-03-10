# Changelog

All notable changes to TransitWind are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.6] - 2026-03-10

### Added
- **Test infrastructure** — 22 backend tests (pytest + TestClient + in-memory SQLite) covering auth, user CRUD, and chart CRUD (ADR 011)
- **Token refresh endpoint** — `POST /api/auth/refresh` reissues JWT from valid token; frontend auto-refreshes on mount (ADR 010)
- **User profile management** — `PUT /api/user/me` (update name/email), `POST /api/user/change-password`, `DELETE /api/user/me` (cascading delete)
- **Chart deletion** — `DELETE /api/chart` clears natal chart and interpretation cache
- **Seed user system** — `backend/app/seed.py` auto-creates user + chart from `.env` vars on startup (idempotent)
- **Profile UI** — editable name/email fields, change password form, delete chart with confirmation, delete account with confirmation modal

### Changed
- Frontend `client.ts` — added `refreshToken`, `updateMe`, `changePassword`, `deleteAccount`, `deleteChart` API methods
- `App.tsx` — token refresh on mount before loading user state
- `.env.example` — added seed user variable placeholders

## [1.1.0] - 2026-03-10

### Added
- **Transit Tools page** (`/tools`) with 3 tabbed features
- **Upcoming Changes table**: all 13 planets' next gate change, ranked by personal significance (channel completion = high, natal reinforcement = medium). AI summary of most important shifts. Retrograde indicators.
- **Sun Gate Tracker**: large gate.line display, progress bar showing position within gate, live countdown timers to next line and gate change. Drift-proof via target timestamps. AI context personalized to user's chart.
- **Ephemeris Calendar**: month-navigable grid (13 planets x days), color-coded cells, click-for-AI-interpretation. Dot indicators on dates with channel completions against user's natal chart. Cached per `(user, planet, gate, line)`.
- Bisection engine (`find_next_gate_change`, `find_next_line_change`) with adaptive stepping per planet speed
- Retrograde detection (`is_retrograde`) via 1-hour longitude comparison
- Significance ranking (`rank_changes_by_significance`) checking all 36 channels
- 4 new API endpoints: `upcoming-changes`, `sun-tracker`, `ephemeris`, `interpret-cell`
- ADR documentation system (`docs/adr/`) with 9 backfilled decision records

### Fixed
- **Path traversal vulnerability** (CWE-23, High) in SPA file serving — replaced manual `FileResponse` catch-all with `StaticFiles(html=True)` (ADR 009)

### Changed
- "Tools" link added to main navigation bar

## [1.0.0] - 2026-03-09

### Added
- Initial release
- Natal chart computation (personality + design) via Swiss Ephemeris
- HD type, authority, profile, and incarnation cross derivation
- Interactive bodygraph SVG with natal/transit/overlay view modes
- Real-time transit positions (cached hourly)
- Transit overlay analysis (reinforced gates, completed channels, newly defined centers)
- AI daily interpretation via Gemini API with template fallback
- Journal with per-day entries linked to transit snapshots
- JWT authentication with bcrypt password hashing
- User profile and birth data management
