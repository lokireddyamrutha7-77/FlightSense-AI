from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_airports: Optional[List[str]] = None
    preferred_routes: Optional[List[Dict[str, str]]] = None

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

class UserProfileStats(BaseModel):
    total_predictions: int = 0
    delayed_predictions_count: int = 0
    most_checked_airline: Optional[str] = "N/A"
    most_checked_route: Optional[str] = "N/A"
    most_checked_airport: Optional[str] = "N/A"
    recent_prediction: Optional[Dict[str, Any]] = None

class CustomerProfileResponse(BaseModel):
    user_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    email_verified: bool = False
    phone_verified: bool = False
    avatar_url: Optional[str] = None
    account_created_at: Optional[datetime] = None
    preferred_airports: List[str] = []
    preferred_routes: List[Dict[str, str]] = []
    stats: UserProfileStats
