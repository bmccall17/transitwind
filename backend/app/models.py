from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    chart = relationship("NatalChart", back_populates="user", uselist=False)
    journal_entries = relationship("JournalEntry", back_populates="user")


class NatalChart(Base):
    __tablename__ = "natal_charts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    birth_datetime_utc = Column(DateTime, nullable=False)
    birth_location = Column(String, nullable=True)
    birth_latitude = Column(Float, nullable=True)
    birth_longitude = Column(Float, nullable=True)
    timezone_str = Column(String, nullable=True)

    # Computed chart data stored as JSON
    chart_data = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="chart")


class TransitCache(Base):
    __tablename__ = "transit_cache"

    id = Column(Integer, primary_key=True, index=True)
    hour_key = Column(String, unique=True, index=True, nullable=False)  # "2026-03-09-14"
    snapshot_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class InterpretationCache(Base):
    __tablename__ = "interpretation_cache"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_key = Column(String, index=True, nullable=False)  # "2026-03-09"
    overlay_hash = Column(String, index=True, nullable=False)
    interpretation = Column(Text, nullable=False)
    prompts = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)  # "2026-03-09"
    content = Column(Text, nullable=False)
    transit_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="journal_entries")
