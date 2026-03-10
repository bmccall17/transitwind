"""
Human Design Mandala Wheel — gate order, channel definitions, center mappings.

The HD wheel maps the 360° zodiac to 64 gates × 6 lines each.
Each gate occupies 5.625° (360/64). Each line occupies 0.9375° (5.625/6).
The wheel starts at Gate 41 at ~58.0° (2°00' Aquarius in traditional astrology).

Gate order follows the codon ring sequence around the mandala.
"""

# Gate order around the wheel (starting from ~58° ecliptic longitude).
# Index 0 = first gate encountered going clockwise from the start point.
GATE_ORDER: list[int] = [
    41, 19, 13, 49, 30, 55, 37, 63,
    22, 36, 25, 17, 21, 51, 42, 3,
    27, 24, 2, 23, 8, 20, 16, 35,
    45, 12, 15, 52, 39, 53, 62, 56,
    31, 33, 7, 4, 29, 59, 40, 64,
    47, 6, 46, 18, 48, 57, 32, 50,
    28, 44, 1, 43, 14, 34, 9, 5,
    26, 11, 10, 58, 38, 54, 61, 60,
]

# Start longitude of Gate 41 (first gate in the sequence)
WHEEL_START_LONGITUDE = 58.0  # degrees ecliptic

DEGREES_PER_GATE = 360.0 / 64  # 5.625°
DEGREES_PER_LINE = DEGREES_PER_GATE / 6  # 0.9375°


def longitude_to_gate_line(longitude: float) -> tuple[int, int]:
    """Convert ecliptic longitude (0-360) to (gate, line).

    Returns:
        (gate_number, line_number) where gate is 1-64 and line is 1-6.
    """
    # Normalize longitude relative to wheel start
    offset = (longitude - WHEEL_START_LONGITUDE) % 360.0
    gate_index = int(offset / DEGREES_PER_GATE)
    gate = GATE_ORDER[gate_index]

    line_offset = offset - (gate_index * DEGREES_PER_GATE)
    line = int(line_offset / DEGREES_PER_LINE) + 1
    line = min(line, 6)  # clamp

    return gate, line


def gate_line_to_longitude_range(gate: int, line: int) -> tuple[float, float]:
    """Return the (start, end) longitude range for a specific gate.line."""
    gate_index = GATE_ORDER.index(gate)
    start = (WHEEL_START_LONGITUDE + gate_index * DEGREES_PER_GATE) % 360.0
    line_start = (start + (line - 1) * DEGREES_PER_LINE) % 360.0
    line_end = (line_start + DEGREES_PER_LINE) % 360.0
    return line_start, line_end


# --- Channel definitions ---
# Each channel connects two gates and passes through two centers.
# Format: (gate_a, gate_b): (center_a, center_b, name)

CHANNELS: dict[tuple[int, int], tuple[str, str, str]] = {
    # Throat connections
    (1, 8): ("G", "Throat", "Inspiration"),
    (2, 14): ("G", "Sacral", "The Beat"),
    (3, 60): ("Sacral", "Root", "Mutation"),
    (4, 63): ("Ajna", "Head", "Logic"),
    (5, 15): ("Sacral", "G", "Rhythms"),
    (6, 59): ("Solar Plexus", "Sacral", "Intimacy"),
    (7, 31): ("G", "Throat", "The Alpha"),
    (9, 52): ("Sacral", "Root", "Concentration"),
    (10, 20): ("G", "Throat", "Awakening"),
    (10, 34): ("G", "Sacral", "Exploration"),
    (10, 57): ("G", "Spleen", "Perfected Form"),
    (11, 56): ("Ajna", "Throat", "Curiosity"),
    (12, 22): ("Throat", "Solar Plexus", "Openness"),
    (13, 33): ("G", "Throat", "The Prodigal"),
    (16, 48): ("Throat", "Spleen", "The Wavelength"),
    (17, 62): ("Ajna", "Throat", "Acceptance"),
    (18, 58): ("Spleen", "Root", "Judgment"),
    (19, 49): ("Root", "Solar Plexus", "Synthesis"),
    (20, 34): ("Throat", "Sacral", "Charisma"),
    (20, 57): ("Throat", "Spleen", "The Brainwave"),
    (21, 45): ("Throat", "G", "The Money Line"),  # actually Heart/Throat; see note
    (23, 43): ("Throat", "Ajna", "Structuring"),
    (24, 61): ("Ajna", "Head", "Awareness"),
    (25, 51): ("G", "Heart", "Initiation"),
    (26, 44): ("Heart", "Spleen", "Surrender"),
    (27, 50): ("Sacral", "Spleen", "Preservation"),
    (28, 38): ("Spleen", "Root", "Struggle"),
    (29, 46): ("Sacral", "G", "Discovery"),
    (30, 41): ("Solar Plexus", "Root", "Recognition"),
    (32, 54): ("Spleen", "Root", "Transformation"),
    (34, 57): ("Sacral", "Spleen", "Power"),
    (35, 36): ("Throat", "Solar Plexus", "Transitoriness"),
    (37, 40): ("Solar Plexus", "Heart", "Community"),  # actually SP/Ego
    (39, 55): ("Root", "Solar Plexus", "Emoting"),
    (42, 53): ("Sacral", "Root", "Maturation"),
    (47, 64): ("Ajna", "Head", "Abstraction"),
}

# Correct center mapping for channels 21-45, 25-51, 37-40
# 21-45: Heart (Ego/Will) — Throat
# 25-51: G — Heart (Ego/Will)
# 37-40: Solar Plexus — Heart (Ego/Will)
CHANNELS[(21, 45)] = ("Heart", "Throat", "The Money Line")

# --- Center definitions ---
# Which gates belong to each center

CENTER_GATES: dict[str, list[int]] = {
    "Head": [64, 61, 63],
    "Ajna": [47, 24, 4, 11, 43, 17],
    "Throat": [62, 23, 56, 35, 12, 45, 33, 8, 31, 7, 1, 13, 10, 20, 16],
    "G": [46, 2, 15, 10, 7, 1, 13, 25, 29, 5],  # note: 10 shared with Throat via different channels
    "Heart": [21, 40, 26, 51],
    "Solar Plexus": [36, 22, 6, 37, 49, 55, 30],
    "Sacral": [34, 5, 14, 29, 59, 9, 3, 42, 27],
    "Spleen": [48, 57, 44, 50, 32, 28, 18],
    "Root": [58, 38, 54, 53, 60, 52, 19, 39, 41],
}

# Build reverse lookup: gate → list of centers it belongs to
GATE_TO_CENTERS: dict[int, list[str]] = {}
for center, gates in CENTER_GATES.items():
    for gate in gates:
        GATE_TO_CENTERS.setdefault(gate, []).append(center)


def get_defined_channels(active_gates: set[int]) -> list[tuple[int, int]]:
    """Given a set of active (defined) gates, return which channels are completed."""
    defined = []
    for (ga, gb) in CHANNELS:
        if ga in active_gates and gb in active_gates:
            defined.append((ga, gb))
    return defined


def get_defined_centers(defined_channels: list[tuple[int, int]]) -> set[str]:
    """A center is defined when at least one complete channel passes through it."""
    centers: set[str] = set()
    for (ga, gb) in defined_channels:
        ca, cb, _ = CHANNELS[(ga, gb)]
        centers.add(ca)
        centers.add(cb)
    return centers


# --- Type derivation ---

def derive_type(defined_centers: set[str], defined_channels: list[tuple[int, int]]) -> str:
    """Derive HD Type from defined centers and channels.

    Rules:
    - Manifestor: Throat connected to a motor (Heart, Solar Plexus, Root, Sacral)
      but Sacral NOT defined
    - Generator: Sacral defined, Throat NOT connected to a motor
    - Manifesting Generator: Sacral defined AND Throat connected to a motor
    - Projector: Sacral NOT defined, no motor-to-Throat connection
    - Reflector: No defined centers
    """
    if not defined_centers:
        return "Reflector"

    sacral_defined = "Sacral" in defined_centers
    motors = {"Heart", "Solar Plexus", "Root", "Sacral"}

    # Check if Throat is connected to a motor center via channel path
    throat_to_motor = _throat_connected_to_motor(defined_channels)

    if sacral_defined and throat_to_motor:
        return "Manifesting Generator"
    elif sacral_defined:
        return "Generator"
    elif throat_to_motor:
        return "Manifestor"
    else:
        return "Projector"


def _throat_connected_to_motor(defined_channels: list[tuple[int, int]]) -> bool:
    """Check if the Throat center is connected to any motor center through defined channels."""
    motors = {"Heart", "Solar Plexus", "Root", "Sacral"}

    # Build adjacency graph of defined centers
    adj: dict[str, set[str]] = {}
    for (ga, gb) in defined_channels:
        ca, cb, _ = CHANNELS[(ga, gb)]
        adj.setdefault(ca, set()).add(cb)
        adj.setdefault(cb, set()).add(ca)

    if "Throat" not in adj:
        return False

    # BFS from Throat to any motor
    visited: set[str] = set()
    queue = ["Throat"]
    while queue:
        current = queue.pop(0)
        if current in motors:
            return True
        visited.add(current)
        for neighbor in adj.get(current, set()):
            if neighbor not in visited:
                queue.append(neighbor)
    return False


def derive_authority(defined_centers: set[str], hd_type: str) -> str:
    """Derive inner authority based on defined centers and type."""
    if hd_type == "Reflector":
        return "Lunar"

    # Authority hierarchy (checked in order)
    if "Solar Plexus" in defined_centers:
        return "Emotional"
    if "Sacral" in defined_centers:
        return "Sacral"
    if "Spleen" in defined_centers:
        return "Splenic"
    if "Heart" in defined_centers:
        return "Ego"
    if "G" in defined_centers:
        return "Self-Projected"
    if "Ajna" in defined_centers:
        return "Mental"  # also called Environment/Sounding Board
    return "None"  # theoretically shouldn't happen


def derive_profile(sun_personality_line: int, sun_design_line: int) -> str:
    """Derive profile from Personality Sun line and Design Sun line."""
    return f"{sun_personality_line}/{sun_design_line}"


CROSS_NAMES: dict[tuple[int, int, int, int], str] = {
    # A subset of common incarnation crosses — full table would have 768+ entries.
    # Format: (personality_sun_gate, personality_earth_gate, design_sun_gate, design_earth_gate)
    # We'll compute the cross gates and return a generic label for MVP.
}


def derive_incarnation_cross(
    p_sun_gate: int, p_earth_gate: int,
    d_sun_gate: int, d_earth_gate: int
) -> str:
    """Return the incarnation cross as a string of the four gates."""
    key = (p_sun_gate, p_earth_gate, d_sun_gate, d_earth_gate)
    if key in CROSS_NAMES:
        return CROSS_NAMES[key]
    return f"Cross of Gates {p_sun_gate}/{p_earth_gate} | {d_sun_gate}/{d_earth_gate}"
