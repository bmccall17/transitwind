# ADR 008: Client-Side Countdown via Target Timestamps

**Date**: 2026-03-10
**Status**: accepted

## Context

The Sun Gate Tracker displays live countdown timers to the next line change and gate change. Two approaches:

1. **Server sends `seconds_remaining`**: Client starts a JS timer counting down. Problem: network latency + JS timer drift cause the displayed time to diverge from reality. `setInterval` is not guaranteed to fire at exact intervals, and tabs in background throttle timers.
2. **Server sends `target_timestamp`**: Client computes `display = target - Date.now()` on each render tick. Always accurate regardless of when the data was fetched.

## Decision

The API returns `target_timestamp` (Unix epoch float) for all countdowns. The client computes remaining time as `target_timestamp * 1000 - Date.now()` on every render.

Additionally:
- Client re-fetches from the API every 15 minutes as a correction mechanism
- Client re-fetches immediately when any countdown reaches zero (to get the new gate/line data)
- Countdown display updates every 1 second via `setInterval`

## Consequences

- Countdown accuracy is bounded only by the system clock, not by JS timer precision
- Background tabs don't cause drift — when the tab comes back, `Date.now()` is correct
- Network latency on the initial fetch doesn't affect accuracy (timestamp is absolute, not relative)
- The 15-minute re-fetch handles edge cases like the user's clock being slightly off
