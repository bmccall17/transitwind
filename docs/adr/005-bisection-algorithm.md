# ADR 005: HD Wheel Bisection Algorithm for Gate/Line Change Detection

**Date**: 2026-03-10
**Status**: accepted

## Context

Transit tools need to answer "when does planet X next change gate/line?" This requires finding the exact moment a planet's ecliptic longitude crosses a gate or line boundary on the HD wheel.

Challenges:
- Planets move at vastly different speeds (Moon: 13.2°/day, Pluto: 0.004°/day)
- Retrograde motion means planets can reverse direction
- The HD wheel wraps at 360°/0° and gate boundaries are non-uniform (they follow the I Ching sequence, not zodiacal order)

## Decision

Use **adaptive stepping + bisection**, the same pattern already proven in `find_design_datetime()`:

1. **Adaptive step size**: `step = (DEGREES_PER_GATE / 2) / daily_motion` — fast planets get small steps, slow planets get large steps. Capped at 30 days.
2. **Forward scan**: Step forward until the gate/line number changes.
3. **Bisection**: Once a change is detected between two timestamps, bisect to 60-second precision (40 iterations max).

Planet daily motion constants:
```
Sun: 1.0, Moon: 13.2, Mercury: 1.2, Venus: 1.0, Mars: 0.5,
Jupiter: 0.08, Saturn: 0.03, Uranus: 0.012, Neptune: 0.006,
Pluto: 0.004, Nodes: 0.05
```

Retrograde is detected by comparing longitude at `dt` vs `dt + 1h`. No special-casing needed in the stepping algorithm — it naturally handles direction changes.

## Consequences

- Handles all 13 planets with a single algorithm, no planet-specific code paths
- 60-second precision is more than sufficient for "time until change" displays
- Worst case for Pluto: step = 5.625/(2*0.004) = 703 days per step, max 200 steps = covers 385 years
- Performance: finding next gate change for all 13 planets takes ~50ms total
- `find_next_line_change()` uses the same algorithm with `DEGREES_PER_LINE` granularity
