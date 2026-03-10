from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import User, JournalEntry
from backend.app.schemas import JournalIn, JournalOut
from backend.app.services.transit import get_current_transit

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.get("", response_model=list[JournalOut])
def list_entries(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user.id)
        .order_by(JournalEntry.date.desc())
        .limit(90)
        .all()
    )
    return entries


@router.post("", response_model=JournalOut)
def create_entry(
    data: JournalIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    date = data.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Check for existing entry on this date
    existing = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user.id, JournalEntry.date == date)
        .first()
    )
    if existing:
        existing.content = data.content
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing

    snapshot = get_current_transit()
    entry = JournalEntry(
        user_id=user.id,
        date=date,
        content=data.content,
        transit_snapshot=snapshot,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{date}", response_model=JournalOut)
def get_entry(
    date: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user.id, JournalEntry.date == date)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No journal entry for this date")
    return entry


@router.delete("/{date}")
def delete_entry(
    date: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user.id, JournalEntry.date == date)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No journal entry for this date")
    db.delete(entry)
    db.commit()
    return {"detail": "Deleted"}
