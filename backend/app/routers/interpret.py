from datetime import datetime, timezone
import hashlib
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import User, NatalChart, InterpretationCache
from backend.app.schemas import InterpretationOut
from backend.app.services.transit import get_current_transit
from backend.app.services.overlay import compute_overlay
from backend.app.services.interpreter import generate_daily_interpretation

router = APIRouter(prefix="/api/interpret", tags=["interpret"])


def _overlay_hash(overlay: dict) -> str:
    """Create a stable hash of the overlay for caching."""
    key_data = json.dumps({
        "reinforced": overlay["reinforced_gates"],
        "completed": sorted([c["gates"] for c in overlay["completed_channels"]]),
        "newly_defined": overlay["newly_defined_centers"],
    }, sort_keys=True)
    return hashlib.sha256(key_data.encode()).hexdigest()[:16]


@router.get("/daily", response_model=InterpretationOut)
async def daily_interpretation(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI-generated interpretation of today's transits on the user's chart."""
    natal = db.query(NatalChart).filter(NatalChart.user_id == user.id).first()
    if not natal:
        raise HTTPException(status_code=404, detail="No chart found")

    snapshot = get_current_transit()
    overlay = compute_overlay(natal.chart_data, snapshot)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    oh = _overlay_hash(overlay)

    # Check cache
    cached = (
        db.query(InterpretationCache)
        .filter(
            InterpretationCache.user_id == user.id,
            InterpretationCache.date_key == today,
            InterpretationCache.overlay_hash == oh,
        )
        .first()
    )
    if cached:
        return InterpretationOut(
            summary=cached.interpretation,
            prompts=cached.prompts or [],
            date=today,
        )

    # Generate new interpretation
    result = await generate_daily_interpretation(overlay, natal.chart_data)

    # Cache it
    cache_entry = InterpretationCache(
        user_id=user.id,
        date_key=today,
        overlay_hash=oh,
        interpretation=result["summary"],
        prompts=result["prompts"],
    )
    db.add(cache_entry)
    db.commit()

    return InterpretationOut(
        summary=result["summary"],
        prompts=result["prompts"],
        date=today,
    )
