from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user, hash_password, verify_password
from backend.app.database import get_db
from backend.app.models import User, NatalChart, JournalEntry, InterpretationCache
from backend.app.schemas import UserOut, UserUpdateIn, ChangePasswordIn

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        has_chart=user.chart is not None,
    )


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user profile (name and/or email)."""
    if data.email is not None and data.email != user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email

    if data.name is not None:
        user.name = data.name

    db.commit()
    db.refresh(user)
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        has_chart=user.chart is not None,
    )


@router.post("/change-password")
def change_password(
    data: ChangePasswordIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change password. Requires current password for verification."""
    if not verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"detail": "Password changed"}


@router.delete("/me")
def delete_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete user account and all associated data."""
    # Delete interpretation cache
    db.query(InterpretationCache).filter(InterpretationCache.user_id == user.id).delete()
    # Delete journal entries
    db.query(JournalEntry).filter(JournalEntry.user_id == user.id).delete()
    # Delete natal chart
    db.query(NatalChart).filter(NatalChart.user_id == user.id).delete()
    # Delete user
    db.delete(user)
    db.commit()
    return {"detail": "Account deleted"}
