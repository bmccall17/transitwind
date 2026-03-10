from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import User, NatalChart
from backend.app.schemas import TransitOut, OverlayOut
from backend.app.services.transit import get_current_transit, get_transit_for_datetime
from backend.app.services.overlay import compute_overlay

router = APIRouter(prefix="/api/transit", tags=["transit"])


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
