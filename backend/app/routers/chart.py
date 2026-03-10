from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import User, NatalChart
from backend.app.schemas import BirthDataIn, ChartOut
from backend.app.services.chart import compute_natal_chart

router = APIRouter(prefix="/api/chart", tags=["chart"])


@router.post("", response_model=ChartOut)
def create_or_update_chart(
    data: BirthDataIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calculate natal chart from birth data and store it."""
    chart_data = compute_natal_chart(data.birth_datetime_utc)

    existing = db.query(NatalChart).filter(NatalChart.user_id == user.id).first()
    if existing:
        existing.birth_datetime_utc = data.birth_datetime_utc
        existing.birth_location = data.birth_location
        existing.birth_latitude = data.birth_latitude
        existing.birth_longitude = data.birth_longitude
        existing.timezone_str = data.timezone_str
        existing.chart_data = chart_data
    else:
        existing = NatalChart(
            user_id=user.id,
            birth_datetime_utc=data.birth_datetime_utc,
            birth_location=data.birth_location,
            birth_latitude=data.birth_latitude,
            birth_longitude=data.birth_longitude,
            timezone_str=data.timezone_str,
            chart_data=chart_data,
        )
        db.add(existing)

    db.commit()
    db.refresh(existing)
    return ChartOut(**existing.chart_data)


@router.get("", response_model=ChartOut)
def get_chart(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the user's natal chart."""
    natal = db.query(NatalChart).filter(NatalChart.user_id == user.id).first()
    if not natal:
        raise HTTPException(status_code=404, detail="No chart found. Submit birth data first.")
    return ChartOut(**natal.chart_data)
