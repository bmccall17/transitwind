"""
Swiss Ephemeris wrapper for planetary position calculations.

Calculates ecliptic longitudes for the 13 HD-relevant celestial bodies.
"""

from datetime import datetime, timedelta, timezone
import swisseph as swe

from backend.app.config import EPHE_PATH
from backend.app.data.wheel import longitude_to_gate_line, DEGREES_PER_GATE, DEGREES_PER_LINE

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


# Average daily motion in degrees for adaptive step sizing
PLANET_DAILY_MOTION: dict[str, float] = {
    "Sun": 1.0, "Earth": 1.0, "Moon": 13.2, "Mercury": 1.2, "Venus": 1.0,
    "Mars": 0.5, "Jupiter": 0.08, "Saturn": 0.03, "Uranus": 0.012,
    "Neptune": 0.006, "Pluto": 0.004, "North Node": 0.05, "South Node": 0.05,
}


def _get_planet_longitude(planet_name: str, dt: datetime) -> float:
    """Get a single planet's ecliptic longitude at a given datetime."""
    jd = _datetime_to_jd(dt)
    if planet_name == "Earth":
        result = swe.calc_ut(jd, swe.SUN)
        return (result[0][0] + 180.0) % 360.0
    if planet_name == "South Node":
        result = swe.calc_ut(jd, swe.MEAN_NODE)
        return (result[0][0] + 180.0) % 360.0
    planet_id = PLANETS[planet_name]
    result = swe.calc_ut(jd, planet_id)
    return result[0][0]


def is_retrograde(planet_name: str, dt: datetime) -> bool:
    """Check if a planet is retrograde at the given datetime.

    Compares longitude at dt vs dt + 1 hour. If longitude decreased, it's retrograde.
    Sun, Moon, Earth, and Nodes are never retrograde.
    """
    if planet_name in ("Sun", "Moon", "Earth", "North Node", "South Node"):
        return False
    lon1 = _get_planet_longitude(planet_name, dt)
    lon2 = _get_planet_longitude(planet_name, dt + timedelta(hours=1))
    # Handle wrap-around at 360/0
    diff = (lon2 - lon1 + 540) % 360 - 180  # normalized to [-180, 180]
    return diff < 0


def find_next_gate_change(planet_name: str, from_dt: datetime) -> dict:
    """Find when a planet next changes HD gate.

    Uses adaptive stepping + bisection (same pattern as find_design_datetime).
    Returns: {"planet", "current_gate", "current_line", "next_gate", "next_line",
              "change_dt", "change_timestamp"}
    """
    daily_motion = PLANET_DAILY_MOTION.get(planet_name, 0.5)
    # Step size: roughly half a gate's worth of motion
    step_days = (DEGREES_PER_GATE / 2) / max(daily_motion, 0.001)
    step = timedelta(days=min(step_days, 30))  # cap at 30 days for slow planets

    current_lon = _get_planet_longitude(planet_name, from_dt)
    current_gate, current_line = longitude_to_gate_line(current_lon)

    # Step forward until gate changes
    prev_dt = from_dt
    check_dt = from_dt + step
    max_steps = 200
    for _ in range(max_steps):
        lon = _get_planet_longitude(planet_name, check_dt)
        gate, line = longitude_to_gate_line(lon)
        if gate != current_gate:
            # Bisect between prev_dt and check_dt to 60-second precision
            low, high = prev_dt, check_dt
            for _ in range(40):  # converges well within 40 iterations
                if (high - low).total_seconds() < 60:
                    break
                mid = low + (high - low) / 2
                mid_lon = _get_planet_longitude(planet_name, mid)
                mid_gate, _ = longitude_to_gate_line(mid_lon)
                if mid_gate == current_gate:
                    low = mid
                else:
                    high = mid
            change_dt = high
            change_lon = _get_planet_longitude(planet_name, change_dt)
            next_gate, next_line = longitude_to_gate_line(change_lon)
            return {
                "planet": planet_name,
                "current_gate": current_gate,
                "current_line": current_line,
                "next_gate": next_gate,
                "next_line": next_line,
                "change_dt": change_dt,
                "change_timestamp": change_dt.timestamp(),
            }
        prev_dt = check_dt
        check_dt = check_dt + step

    # Shouldn't reach here, but return a far-future fallback
    return {
        "planet": planet_name,
        "current_gate": current_gate,
        "current_line": current_line,
        "next_gate": current_gate,
        "next_line": current_line,
        "change_dt": from_dt + timedelta(days=365),
        "change_timestamp": (from_dt + timedelta(days=365)).timestamp(),
    }


def find_next_line_change(planet_name: str, from_dt: datetime) -> dict:
    """Find when a planet next changes HD line (finer granularity than gate).

    Returns: {"planet", "current_gate", "current_line", "next_gate", "next_line",
              "change_dt", "change_timestamp"}
    """
    daily_motion = PLANET_DAILY_MOTION.get(planet_name, 0.5)
    step_days = (DEGREES_PER_LINE / 2) / max(daily_motion, 0.001)
    step = timedelta(days=min(step_days, 10))

    current_lon = _get_planet_longitude(planet_name, from_dt)
    current_gate, current_line = longitude_to_gate_line(current_lon)

    prev_dt = from_dt
    check_dt = from_dt + step
    max_steps = 300
    for _ in range(max_steps):
        lon = _get_planet_longitude(planet_name, check_dt)
        gate, line = longitude_to_gate_line(lon)
        if gate != current_gate or line != current_line:
            # Bisect to 60-second precision
            low, high = prev_dt, check_dt
            for _ in range(40):
                if (high - low).total_seconds() < 60:
                    break
                mid = low + (high - low) / 2
                mid_lon = _get_planet_longitude(planet_name, mid)
                mid_gate, mid_line = longitude_to_gate_line(mid_lon)
                if mid_gate == current_gate and mid_line == current_line:
                    low = mid
                else:
                    high = mid
            change_dt = high
            change_lon = _get_planet_longitude(planet_name, change_dt)
            next_gate, next_line = longitude_to_gate_line(change_lon)
            return {
                "planet": planet_name,
                "current_gate": current_gate,
                "current_line": current_line,
                "next_gate": next_gate,
                "next_line": next_line,
                "change_dt": change_dt,
                "change_timestamp": change_dt.timestamp(),
            }
        prev_dt = check_dt
        check_dt = check_dt + step

    return {
        "planet": planet_name,
        "current_gate": current_gate,
        "current_line": current_line,
        "next_gate": current_gate,
        "next_line": current_line,
        "change_dt": from_dt + timedelta(days=365),
        "change_timestamp": (from_dt + timedelta(days=365)).timestamp(),
    }


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
