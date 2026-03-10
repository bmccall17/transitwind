# ADR 007: AI Interpretation Caching Strategy

**Date**: 2026-03-10
**Status**: accepted

## Context

The ephemeris calendar allows users to click any cell (planet x date) for an AI interpretation. Without caching, each click triggers a Gemini API call. For a month view with 13 planets x 31 days = 403 possible cells, uncached usage could be expensive and slow.

Key insight: a user's interpretation of "Mars in Gate 34.2" never changes — their natal chart is fixed, and the interpretation depends only on `(user_id, planet, gate, line)`.

## Decision

Cache cell interpretations in the existing `InterpretationCache` table, keyed by `(user_id, planet:gate:line)`. The `date_key` column stores the composite key `"planet:gate:line"` and `overlay_hash` mirrors it.

Cache behavior:
- **Hit**: Return cached interpretation immediately, no API call
- **Miss**: Call Gemini, store result, return
- **Invalidation**: None needed. A user's natal chart doesn't change, so cached interpretations are permanently valid.

Daily interpretations (existing feature) use a separate caching strategy keyed by `(user_id, date)` since those depend on the full overlay which changes daily.

## Consequences

- Each unique `(user, planet, gate, line)` combination costs at most one API call, ever
- Over time, a user's cache fills up and the ephemeris calendar becomes instant
- Cache grows at most 13 planets x 64 gates x 6 lines = 4,992 rows per user (in practice much less)
- No TTL or eviction needed — interpretations are immutable
- If a user re-enters birth data (new natal chart), old cached interpretations become stale but harmless — they'd need manual cleanup or a cache-clear on chart update
