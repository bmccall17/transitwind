"""
Transit calculation service.

Provides current planetary positions and caches per hour.
"""

from datetime import datetime, timezone
from backend.app.services.ephemeris import get_planetary_positions

# Simple in-memory cache: key = hour string, value = transit snapshot
_cache: dict[str, dict] = {}


def get_current_transit() -> dict:
    """Get the current transit snapshot (planetary positions now).

    Cached per hour since most planets move slowly enough.
    Moon changes gate ~every 5.3 hours so hourly is reasonable.
    """
    now = datetime.now(timezone.utc)
    return get_transit_for_datetime(now)


def get_transit_for_datetime(dt: datetime) -> dict:
    """Get transit snapshot for a specific datetime."""
    cache_key = dt.strftime("%Y-%m-%d-%H")

    if cache_key in _cache:
        return _cache[cache_key]

    positions = get_planetary_positions(dt)

    # Collect active gates
    active_gates: set[int] = set()
    for pos in positions:
        active_gates.add(pos["gate"])

    from backend.app.data.wheel import get_defined_channels, get_defined_centers
    channels = get_defined_channels(active_gates)
    centers = get_defined_centers(channels)

    snapshot = {
        "datetime_utc": dt.isoformat(),
        "positions": positions,
        "active_gates": sorted(active_gates),
        "defined_channels": [(a, b) for a, b in channels],
        "defined_centers": sorted(centers),
    }

    _cache[cache_key] = snapshot

    # Keep cache small — only last 48 hours
    if len(_cache) > 48:
        oldest_key = min(_cache.keys())
        del _cache[oldest_key]

    return snapshot
