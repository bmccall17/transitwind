from datetime import datetime
from pydantic import BaseModel, EmailStr


# --- Auth ---

class UserRegister(BaseModel):
    email: str
    password: str
    name: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- User ---

class UserOut(BaseModel):
    id: int
    email: str
    name: str | None
    has_chart: bool

    model_config = {"from_attributes": True}


# --- Chart ---

class BirthDataIn(BaseModel):
    birth_datetime_utc: datetime
    birth_location: str | None = None
    birth_latitude: float | None = None
    birth_longitude: float | None = None
    timezone_str: str | None = None


class ChartOut(BaseModel):
    type: str
    strategy: str
    authority: str
    profile: str
    incarnation_cross: str
    defined_gates: list[int]
    defined_channels: list[list[int]]
    defined_centers: list[str]
    undefined_centers: list[str]
    personality: list[dict]
    design: list[dict]

    model_config = {"from_attributes": True}


# --- Transit ---

class TransitOut(BaseModel):
    datetime_utc: str
    positions: list[dict]
    active_gates: list[int]
    defined_channels: list[list[int]]
    defined_centers: list[str]


class OverlayOut(BaseModel):
    transit_gates: list[int]
    natal_gates: list[int]
    reinforced_gates: list[int]
    bridging_gates: list[int]
    completed_channels: list[dict]
    newly_defined_centers: list[str]
    all_defined_centers: list[str]
    transit_only_gates: list[int]


# --- Interpretation ---

class InterpretationOut(BaseModel):
    summary: str
    prompts: list[str]
    date: str


# --- Transit Tools ---

class UpcomingChangeOut(BaseModel):
    planet: str
    current_gate: int
    current_line: int
    next_gate: int
    next_line: int
    change_timestamp: float
    is_retrograde: bool
    significance: str  # high, medium, low
    reason: str


class UpcomingChangesResponse(BaseModel):
    changes: list[UpcomingChangeOut]
    ai_summary: str


class SunTrackerOut(BaseModel):
    current_gate: int
    current_line: int
    longitude: float
    gate_progress: float  # 0.0 to 1.0, position within gate
    next_line_timestamp: float
    next_gate_timestamp: float
    next_gate: int
    prev_gate: int
    ai_context: str


class EphemerisCell(BaseModel):
    gate: int
    line: int


class EphemerisDay(BaseModel):
    date: str
    planets: dict[str, EphemerisCell]
    has_channel_completion: bool
    completed_channels: list[str]


class EphemerisResponse(BaseModel):
    days: list[EphemerisDay]
    planet_order: list[str]


class InterpretCellIn(BaseModel):
    planet: str
    gate: int
    line: int
    date: str


class InterpretCellOut(BaseModel):
    interpretation: str


# --- Journal ---

class JournalIn(BaseModel):
    content: str
    date: str | None = None  # defaults to today


class JournalOut(BaseModel):
    id: int
    date: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
