"""
Overlay computation — combining natal chart with current transits.

The overlay determines:
- Which transit gates reinforce natal gates
- Which transit gates complete channels with natal gates
- Which centers become temporarily defined
"""

from backend.app.data.wheel import (
    CHANNELS,
    get_defined_channels,
    get_defined_centers,
)


def rank_changes_by_significance(upcoming_changes: list[dict], natal_chart: dict) -> list[dict]:
    """Rank upcoming gate changes by personal significance.

    Significance levels:
    - high: next_gate completes a channel with a natal gate
    - medium: next_gate matches a natal gate (reinforcement)
    - low: no special interaction
    """
    natal_gates = set(natal_chart["defined_gates"])

    for change in upcoming_changes:
        next_gate = change["next_gate"]
        significance = "low"
        reason = ""

        # Check if next_gate completes any channel with a natal gate
        for (ga, gb), (ca, cb, name) in CHANNELS.items():
            if next_gate == ga and gb in natal_gates:
                significance = "high"
                reason = f"Completes your Channel of {name} ({ga}-{gb}) connecting {ca} ↔ {cb}"
                break
            if next_gate == gb and ga in natal_gates:
                significance = "high"
                reason = f"Completes your Channel of {name} ({ga}-{gb}) connecting {ca} ↔ {cb}"
                break

        if significance == "low" and next_gate in natal_gates:
            significance = "medium"
            reason = f"Reinforces your natal Gate {next_gate}"

        change["significance"] = significance
        change["reason"] = reason

    # Sort: high first, then medium, then low. Within same level, sort by time
    order = {"high": 0, "medium": 1, "low": 2}
    upcoming_changes.sort(key=lambda c: (order[c["significance"]], c["change_timestamp"]))
    return upcoming_changes


def compute_overlay(natal_chart: dict, transit_snapshot: dict) -> dict:
    """Compute the overlay of transits on a natal chart.

    Returns:
        {
            "transit_gates": [...],         # gates active in transit
            "natal_gates": [...],           # gates active in natal chart
            "reinforced_gates": [...],      # gates active in BOTH natal and transit
            "bridging_gates": [...],        # transit gates that complete a natal channel
            "completed_channels": [...],    # channels completed by transit + natal
            "newly_defined_centers": [...], # centers defined only with transit overlay
            "all_defined_centers": [...],   # all currently defined centers
            "transit_only_gates": [...],    # transit gates not in natal chart
        }
    """
    natal_gates = set(natal_chart["defined_gates"])
    transit_gates = set(transit_snapshot["active_gates"])
    natal_channels = set(tuple(c) for c in natal_chart["defined_channels"])
    natal_centers = set(natal_chart["defined_centers"])

    # Combined gate activation
    combined_gates = natal_gates | transit_gates

    # Reinforced = in both
    reinforced = natal_gates & transit_gates

    # All channels with combined gates
    all_channels = get_defined_channels(combined_gates)
    all_channels_set = set(tuple(c) for c in all_channels)

    # Channels completed by transit (not already in natal)
    completed_by_transit = all_channels_set - natal_channels

    # Bridging gates = transit gates that are part of a newly completed channel
    bridging: set[int] = set()
    for (ga, gb) in completed_by_transit:
        if ga in transit_gates and ga not in natal_gates:
            bridging.add(ga)
        if gb in transit_gates and gb not in natal_gates:
            bridging.add(gb)

    # Center analysis
    all_centers = get_defined_centers(all_channels)
    newly_defined = all_centers - natal_centers

    # Transit-only gates (in transit, not in natal)
    transit_only = transit_gates - natal_gates

    # Build detailed channel completion info
    channel_details = []
    for (ga, gb) in completed_by_transit:
        ca, cb, name = CHANNELS[(ga, gb)]
        channel_details.append({
            "gates": [ga, gb],
            "centers": [ca, cb],
            "name": name,
            "natal_gate": ga if ga in natal_gates else gb,
            "transit_gate": ga if ga in transit_gates and ga not in natal_gates else gb,
        })

    return {
        "transit_gates": sorted(transit_gates),
        "natal_gates": sorted(natal_gates),
        "reinforced_gates": sorted(reinforced),
        "bridging_gates": sorted(bridging),
        "completed_channels": channel_details,
        "newly_defined_centers": sorted(newly_defined),
        "all_defined_centers": sorted(all_centers),
        "transit_only_gates": sorted(transit_only),
        "natal_channels": [(a, b) for a, b in natal_channels],
        "all_channels": [(a, b) for a, b in all_channels_set],
    }
