"""Seed the database with the initial user and chart.

SCALING NOTE:
When onboarding new users, remove the seed() call from main.py startup.
Registration is already open via POST /api/auth/register.
Future steps:
1. Add email verification before account activation
2. Add rate limiting on /auth/register and /auth/login
3. Add admin role / user management dashboard
4. Consider PostgreSQL migration for concurrent access
"""

import os
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.app.auth import hash_password
from backend.app.database import SessionLocal
from backend.app.models import User, NatalChart
from backend.app.services.chart import compute_natal_chart


def seed():
    """Create the seed user and chart if they don't already exist.

    Reads configuration from environment variables:
    - SEED_USER_EMAIL: user's email address
    - SEED_USER_PASSWORD: user's password
    - SEED_BIRTH_DATETIME: ISO format UTC birth datetime
    - SEED_BIRTH_LOCATION: birth location string
    - SEED_BIRTH_LAT: birth latitude
    - SEED_BIRTH_LON: birth longitude
    """
    email = os.getenv("SEED_USER_EMAIL")
    password = os.getenv("SEED_USER_PASSWORD")

    if not email or not password:
        return  # No seed config, skip silently

    db: Session = SessionLocal()
    try:
        # Check if user already exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return  # Already seeded

        # Create user
        user = User(
            email=email,
            hashed_password=hash_password(password),
            name=os.getenv("SEED_USER_NAME", ""),
        )
        db.add(user)
        db.flush()  # Get user.id

        # Create natal chart if birth data is provided
        birth_dt_str = os.getenv("SEED_BIRTH_DATETIME")
        if birth_dt_str:
            birth_dt = datetime.fromisoformat(birth_dt_str.replace("Z", "+00:00"))
            chart_data = compute_natal_chart(birth_dt)

            chart = NatalChart(
                user_id=user.id,
                birth_datetime_utc=birth_dt,
                birth_location=os.getenv("SEED_BIRTH_LOCATION", ""),
                birth_latitude=float(os.getenv("SEED_BIRTH_LAT", "0")),
                birth_longitude=float(os.getenv("SEED_BIRTH_LON", "0")),
                chart_data=chart_data,
            )
            db.add(chart)

        db.commit()
    finally:
        db.close()
