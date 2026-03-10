"""
Swiss Ephemeris wrapper for planetary position calculations.

Calculates ecliptic longitudes for the 13 HD-relevant celestial bodies.
"""

from datetime import datetime, timezone
import swisseph as swe

from backend.app.config import EPHE_PATH
from backend.app.data.wheel import longitude_to_gate_line

if EPHE_PATH:
    swe.set_ephe_path(EPHE_PATH)

# HD uses 13 celestial bodies
# Swiss Ephemeris planet constants
PLANETS = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
    "Uranus": swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO,
    "North Node": swe.MEAN_NODE,
}


def _datetime_to_jd(dt: datetime) -> float:
    """Convert a datetime (UTC) to Julian Day number."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    utc = dt.astimezone(timezone.utc)
    jd = swe.julday(
        utc.year, utc.month, utc.day,
        utc.hour + utc.minute / 60.0 + utc.second / 3600.0
    )
    return jd


def get_planetary_positions(dt: datetime) -> list[dict]:
    """Calculate positions for all 13 HD planets at a given UTC datetime.

    Returns a list of dicts:
        [{"planet": "Sun", "longitude": 123.45, "gate": 14, "line": 3}, ...]
    """
    jd = _datetime_to_jd(dt)
    positions = []

    for name, planet_id in PLANETS.items():
        result = swe.calc_ut(jd, planet_id)
        lon = result[0][0]  # ecliptic longitude
        gate, line = longitude_to_gate_line(lon)
        positions.append({
            "planet": name,
            "longitude": round(lon, 4),
            "gate": gate,
            "line": line,
        })

    # Earth is always opposite Sun
    sun_lon = next(p["longitude"] for p in positions if p["planet"] == "Sun")
    earth_lon = (sun_lon + 180.0) % 360.0
    earth_gate, earth_line = longitude_to_gate_line(earth_lon)
    positions.append({
        "planet": "Earth",
        "longitude": round(earth_lon, 4),
        "gate": earth_gate,
        "line": earth_line,
    })

    # South Node is opposite North Node
    nn_lon = next(p["longitude"] for p in positions if p["planet"] == "North Node")
    sn_lon = (nn_lon + 180.0) % 360.0
    sn_gate, sn_line = longitude_to_gate_line(sn_lon)
    positions.append({
        "planet": "South Node",
        "longitude": round(sn_lon, 4),
        "gate": sn_gate,
        "line": sn_line,
    })

    return positions


def get_sun_longitude(dt: datetime) -> float:
    """Get the Sun's ecliptic longitude at a given datetime."""
    jd = _datetime_to_jd(dt)
    result = swe.calc_ut(jd, swe.SUN)
    return result[0][0]


def find_design_datetime(birth_dt: datetime) -> datetime:
    """Find the datetime when the Sun was 88° before its birth position.

    The Design calculation in HD uses the moment when the Sun was
    exactly 88 degrees of arc before the birth Sun position.

    Uses bisection to find the exact moment.
    """
    birth_sun_lon = get_sun_longitude(birth_dt)
    target_lon = (birth_sun_lon - 88.0) % 360.0

    # The Sun moves ~1° per day, so 88° ≈ 88 days before birth
    from datetime import timedelta
    estimate = birth_dt - timedelta(days=88)

    # Bisection search: find when Sun longitude == target_lon
    # Start with a wide bracket
    low_dt = birth_dt - timedelta(days=95)
    high_dt = birth_dt - timedelta(days=80)

    # Ensure we bracket the target
    low_lon = get_sun_longitude(low_dt)
    high_lon = get_sun_longitude(high_dt)

    # Handle wrap-around: normalize relative to target
    def _offset(lon: float) -> float:
        diff = (lon - target_lon) % 360.0
        if diff > 180:
            diff -= 360
        return diff

    for _ in range(50):  # max iterations for precision
        mid_dt = low_dt + (high_dt - low_dt) / 2
        mid_lon = get_sun_longitude(mid_dt)
        mid_off = _offset(mid_lon)

        if abs(mid_off) < 0.0001:  # ~0.36 arc-seconds precision
            return mid_dt

        low_off = _offset(get_sun_longitude(low_dt))

        if (low_off < 0 and mid_off < 0) or (low_off > 0 and mid_off > 0):
            low_dt = mid_dt
        else:
            high_dt = mid_dt

    return low_dt + (high_dt - low_dt) / 2
