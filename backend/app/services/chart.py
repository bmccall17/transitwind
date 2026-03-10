"""
Natal chart computation service.

Calculates the full Human Design natal chart from birth data.
"""

from datetime import datetime
from backend.app.data.wheel import (
    get_defined_channels,
    get_defined_centers,
    derive_type,
    derive_authority,
    derive_profile,
    derive_incarnation_cross,
)
from backend.app.services.ephemeris import (
    get_planetary_positions,
    find_design_datetime,
)


def compute_natal_chart(birth_dt_utc: datetime) -> dict:
    """Compute a full HD natal chart from a UTC birth datetime.

    Returns a dict with:
    - personality: list of planetary positions at birth
    - design: list of planetary positions at design time (88° Sun arc before birth)
    - defined_gates: set of all active gates
    - defined_channels: list of completed channel tuples
    - defined_centers: set of defined center names
    - undefined_centers: set of undefined center names
    - type: HD type string
    - authority: inner authority string
    - profile: profile string (e.g. "4/6")
    - incarnation_cross: cross string
    """
    # Personality = birth moment positions
    personality = get_planetary_positions(birth_dt_utc)

    # Design = 88° Sun arc before birth
    design_dt = find_design_datetime(birth_dt_utc)
    design = get_planetary_positions(design_dt)

    # Collect all activated gates
    all_gates: set[int] = set()
    for pos in personality + design:
        all_gates.add(pos["gate"])

    # Derive chart properties
    defined_channels = get_defined_channels(all_gates)
    defined_centers = get_defined_centers(defined_channels)

    all_centers = {"Head", "Ajna", "Throat", "G", "Heart", "Solar Plexus", "Sacral", "Spleen", "Root"}
    undefined_centers = all_centers - defined_centers

    hd_type = derive_type(defined_centers, defined_channels)
    authority = derive_authority(defined_centers, hd_type)

    # Profile from Personality Sun line / Design Sun line
    p_sun = next(p for p in personality if p["planet"] == "Sun")
    d_sun = next(p for p in design if p["planet"] == "Sun")
    profile = derive_profile(p_sun["line"], d_sun["line"])

    # Incarnation cross from Sun/Earth gates
    p_earth = next(p for p in personality if p["planet"] == "Earth")
    d_earth = next(p for p in design if p["planet"] == "Earth")
    cross = derive_incarnation_cross(
        p_sun["gate"], p_earth["gate"],
        d_sun["gate"], d_earth["gate"]
    )

    # Strategy mapping
    strategy_map = {
        "Generator": "Wait to Respond",
        "Manifesting Generator": "Wait to Respond",
        "Projector": "Wait for the Invitation",
        "Manifestor": "Inform",
        "Reflector": "Wait a Lunar Cycle",
    }

    return {
        "personality": personality,
        "design": design,
        "design_datetime_utc": design_dt.isoformat(),
        "defined_gates": sorted(all_gates),
        "defined_channels": [(a, b) for a, b in defined_channels],
        "defined_centers": sorted(defined_centers),
        "undefined_centers": sorted(undefined_centers),
        "type": hd_type,
        "strategy": strategy_map.get(hd_type, ""),
        "authority": authority,
        "profile": profile,
        "incarnation_cross": cross,
    }
