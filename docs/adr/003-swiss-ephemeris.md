# ADR 003: Swiss Ephemeris for Planetary Calculations

**Date**: 2026-03-09
**Status**: accepted

## Context

Human Design requires precise ecliptic longitudes for 13 celestial bodies (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, North Node, Earth, South Node). Accuracy matters — even small errors shift gate/line assignments.

Options:
1. **Swiss Ephemeris (pyswisseph)** — gold standard for astrological software, sub-arcsecond accuracy, C library with Python bindings
2. **Skyfield** — modern Python astronomy library, excellent API, but less common in HD/astrology tooling
3. **External API** — e.g., astro.com or similar. Network dependency, rate limits, latency

## Decision

Use Swiss Ephemeris via `pyswisseph`. Compute Earth as Sun+180° and South Node as North Node+180° rather than separate ephemeris calls.

The wheel mapping uses Gate 41 at 302.0° ecliptic as the starting point, with each gate occupying 5.625° (360/64) and each line 0.9375° (5.625/6).

## Consequences

- Highly accurate planetary positions matching Jovian Archive reference data
- Fast — `swe.calc_ut()` is microsecond-level, enabling bulk calculations (ephemeris grid: 403 calls ≈ 40ms)
- Requires ephemeris data files for dates outside the built-in range (not a concern for transit use)
- C dependency means we need compilation tools in the Docker build
