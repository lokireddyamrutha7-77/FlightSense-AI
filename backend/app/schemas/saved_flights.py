from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SavedFlightCreate(BaseModel):
    flight_number: str = Field(..., example="AA-1042")
    carrier: str = Field(..., example="AA")
    origin: str = Field(..., example="JFK")
    destination: str = Field(..., example="LAX")
    scheduled_departure: Optional[str] = Field(default=None, example="2026-09-25T14:30:00Z")

class SavedFlightResponse(BaseModel):
    id: int
    user_id: int
    flight_number: str
    carrier: str
    origin: str
    destination: str
    scheduled_departure: Optional[str] = None
    created_at: datetime
