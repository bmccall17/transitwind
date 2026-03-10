# ADR 006: Transit Tools — 3-Feature Consolidation from myBodyGraph's 4

**Date**: 2026-03-10
**Status**: accepted

## Context

myBodyGraph offers 4 transit tool features:
1. Gate Activation Tracker (table of planet positions)
2. Activation Watch (gauge showing current gate progress)
3. Sun Gate detail view with countdown
4. Ephemeris calendar grid

These show raw ephemeris data well but have zero AI interpretation. Features 1 and 2 display the same underlying data in different formats.

## Decision

Consolidate into 3 features, each adding AI-powered personalization:

### Feature A: Upcoming Changes Table
- All 13 planets with current gate, next gate, time until change, retrograde status
- **Our addition**: Ranked by personal significance. Transit completing a natal channel = high priority, reinforcing a natal gate = medium, otherwise low. AI summary at top.

### Feature B: Sun Gate Tracker
- Large gate.line display, progress bar, countdown timers
- **Our addition**: AI context explaining what this Sun gate means for the user's chart

### Feature C: Ephemeris Calendar
- 13-row x N-col grid (planets x dates), month navigation
- **Our addition**: Clickable cells with AI interpretation, highlighted dates where channel completions happen with the user's natal chart

All three live under `/tools` with tab navigation.

## Consequences

- 4 new API endpoints: `upcoming-changes`, `sun-tracker`, `ephemeris`, `interpret-cell`
- Significance ranking (`overlay.py`) checks all 36 channels for each upcoming gate change
- AI cost scales with user interaction (cell clicks), not with page loads
- Feature A and B are real-time; Feature C is date-ranged
