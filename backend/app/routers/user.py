from fastapi import APIRouter, Depends
from backend.app.auth import get_current_user
from backend.app.models import User
from backend.app.schemas import UserOut

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        has_chart=user.chart is not None,
    )
