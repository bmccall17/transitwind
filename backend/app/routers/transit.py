from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import User, NatalChart, InterpretationCache
from backend.app.schemas import (
    TransitOut, OverlayOut, UpcomingChangesResponse, SunTrackerOut,
    EphemerisResponse, EphemerisDay, EphemerisCell, InterpretCellIn, InterpretCellOut,
)
from backend.app.services.transit import get_current_transit, get_transit_for_datetime
from backend.app.services.overlay import compute_overlay, rank_changes_by_significance
from backend.app.services.ephemeris import (
    get_planetary_positions, find_next_gate_change, find_next_line_change,
    is_retrograde, _get_planet_longitude, PLANET_DAILY_MOTION,
)
from backend.app.services.interpreter import (
    generate_upcoming_summary, generate_gate_context, generate_cell_interpretation,
)
from backend.app.data.wheel import (
    longitude_to_gate_line, DEGREES_PER_GATE, WHEEL_START_LONGITUDE, GATE_ORDER,
    CHANNELS, get_defined_channels,
)

router = APIRouter(prefix="/api/transit", tags=["transit"])

ALL_PLANETS = [
    "Sun", "Earth", "Moon", "North Node", "South Node",
    "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
    "Uranus", "Neptune", "Pluto",
]


@router.get("/current", response_model=TransitOut)
def current_transit():
    """Get current planetary transit positions."""
    snapshot = get_current_transit()
    return TransitOut(**snapshot)


@router.get("/overlay", response_model=OverlayOut)
def get_overlay(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current transit overlay on the user's natal chart."""
    natal = db.query(NatalChart).filter(NatalChart.user_id == user.id).first()
    if not natal:
        raise HTTPException(status_code=404, detail="No chart found")

    snapshot = get_current_transit()
    overlay = compute_overlay(natal.chart_data, snapshot)
    return OverlayOut(**overlay)


@router.get("/by-date", response_model=OverlayOut)
def get_overlay_by_date(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get transit overlay for a specific date (noon UTC)."""
    natal = db.query(NatalChart).filter(NatalChart.user_id == user.id).first()
    if not natal:
        raise HTTPException(status_code=404, detail="No chart found")

    try:
        dt = datetime.strptime(date, "%Y-%m-%d").replace(hour=12, tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    snapshot = get_transit_for_datetime(dt)
    overlay = compute_overlay(natal.chart_data, snapshot)
    return OverlayOut(**overlay)


@router.get("/upcoming-changes", response_model=UpcomingChangesResponse)
async def upcoming_changes(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get upcoming gate changes for all 13 planets, ranked by personal significance."""
    natal = db.query(NatalChart).filter(NatalChart.user_id == user.id).first()
    if not natal:
        raise HTTPException(status_code=404, detail="No chart found")

    now = datetime.now(timezone.utc)
    changes = []
    for planet in ALL_PLANETS:
        change = find_next_gate_change(planet, now)
        change["is_retrograde"] = is_retrograde(planet, now)
        changes.append(change)

    ranked = rank_changes_by_significance(changes, natal.chart_data)
    ai_summary = await generate_upcoming_summary(ranked, natal.chart_data)

    return UpcomingChangesResponse(changes=ranked, ai_summary=ai_summary)


@router.get("/sun-tracker", response_model=SunTrackerOut)
async def sun_tracker(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current Sun gate/line with countdown timers and AI context."""
    natal = db.query(NatalChart).filter(NatalChart.user_id == user.id).first()
    if not natal:
        raise HTTPException(status_code=404, detail="No chart found")

    now = datetime.now(timezone.utc)
    sun_lon = _get_planet_longitude("Sun", now)
    current_gate, current_line = longitude_to_gate_line(sun_lon)

    # Progress within gate: how far through the current gate (0.0 to 1.0)
    gate_index = GATE_ORDER.index(current_gate)
    gate_start_lon = (WHEEL_START_LONGITUDE + gate_index * DEGREES_PER_GATE) % 360.0
    offset_in_gate = (sun_lon - gate_start_lon + 360) % 360
    gate_progress = min(offset_in_gate / DEGREES_PER_GATE, 1.0)

    # Next line change
    line_change = find_next_line_change("Sun", now)
    # Next gate change
    gate_change = find_next_gate_change("Sun", now)

    # Previous gate (gate before current in wheel order)
    prev_index = (gate_index - 1) % 64
    prev_gate = GATE_ORDER[prev_index]

    ai_context = await generate_gate_context("Sun", current_gate, current_line, natal.chart_data)

    return SunTrackerOut(
        current_gate=current_gate,
        current_line=current_line,
        longitude=round(sun_lon, 4),
        gate_progress=round(gate_progress, 4),
        next_line_timestamp=line_change["change_timestamp"],
        next_gate_timestamp=gate_change["change_timestamp"],
        next_gate=gate_change["next_gate"],
        prev_gate=prev_gate,
        ai_context=ai_context,
    )


@router.get("/ephemeris", response_model=EphemerisResponse)
def ephemeris_grid(
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    days: int = Query(30, ge=1, le=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get ephemeris calendar grid data."""
    natal = db.query(NatalChart).filter(NatalChart.user_id == user.id).first()
    if not natal:
        raise HTTPException(status_code=404, detail="No chart found")

    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(hour=12, tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    natal_gates = set(natal.chart_data["defined_gates"])
    result_days = []

    for day_offset in range(days):
        dt = start_dt + timedelta(days=day_offset)
        positions = get_planetary_positions(dt)

        planets_dict: dict[str, EphemerisCell] = {}
        transit_gates: set[int] = set()
        for pos in positions:
            planets_dict[pos["planet"]] = EphemerisCell(gate=pos["gate"], line=pos["line"])
            transit_gates.add(pos["gate"])

        # Check for channel completions with natal chart
        combined_gates = natal_gates | transit_gates
        all_channels = get_defined_channels(combined_gates)
        natal_channels = get_defined_channels(natal_gates)
        natal_channel_set = set(tuple(c) for c in natal_channels)
        completed = []
        for ch in all_channels:
            if tuple(ch) not in natal_channel_set:
                ca, cb, name = CHANNELS[tuple(ch)]
                completed.append(name)

        result_days.append(EphemerisDay(
            date=dt.strftime("%Y-%m-%d"),
            planets=planets_dict,
            has_channel_completion=len(completed) > 0,
            completed_channels=completed,
        ))

    return EphemerisResponse(days=result_days, planet_order=ALL_PLANETS)


@router.post("/interpret-cell", response_model=InterpretCellOut)
async def interpret_cell(
    body: InterpretCellIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI interpretation for a specific ephemeris cell. Cached per user."""
    natal = db.query(NatalChart).filter(NatalChart.user_id == user.id).first()
    if not natal:
        raise HTTPException(status_code=404, detail="No chart found")

    # Check cache: keyed by (user_id, planet, gate, line)
    cache_key = f"{body.planet}:{body.gate}:{body.line}"
    cached = db.query(InterpretationCache).filter(
        InterpretationCache.user_id == user.id,
        InterpretationCache.date_key == cache_key,
    ).first()
    if cached:
        return InterpretCellOut(interpretation=cached.interpretation)

    interpretation = await generate_cell_interpretation(
        body.planet, body.gate, body.line, body.date, natal.chart_data
    )

    # Cache it
    new_cache = InterpretationCache(
        user_id=user.id,
        date_key=cache_key,
        overlay_hash=cache_key,
        interpretation=interpretation,
        prompts=[],
    )
    db.add(new_cache)
    db.commit()

    return InterpretCellOut(interpretation=interpretation)
