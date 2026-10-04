from collections import Counter
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.app.db.session import get_db
from backend.app.db.models import PredictionLogModel
from backend.app.db.crud import (
    get_or_create_user_profile,
    update_user_profile,
    update_user_password,
    verify_password
)
from backend.app.api.v1.endpoints.auth import get_current_user
from backend.app.schemas.profile import (
    CustomerProfileResponse,
    UpdateProfileRequest,
    ChangePasswordRequest,
    UserProfileStats
)

router = APIRouter()

@router.get("/profile", response_model=CustomerProfileResponse)
def get_profile(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns profile and computed statistics for currently authenticated user."""
    profile_db = get_or_create_user_profile(db, current_user.id)
    
    # Query user prediction statistics dynamically
    predictions = (
        db.query(PredictionLogModel)
        .filter(PredictionLogModel.user_id == current_user.id)
        .order_by(PredictionLogModel.created_at.desc())
        .all()
    )

    total_preds = len(predictions)
    delayed_preds = sum(1 for p in predictions if p.is_delayed or p.risk_level in ["High Risk", "Severe Risk"])

    carriers = [p.carrier for p in predictions if p.carrier]
    routes = [f"{p.origin} → {p.destination}" for p in predictions if p.origin and p.destination]
    airports = [p.origin for p in predictions if p.origin] + [p.destination for p in predictions if p.destination]

    most_airline = Counter(carriers).most_common(1)[0][0] if carriers else "N/A"
    most_route = Counter(routes).most_common(1)[0][0] if routes else "N/A"
    most_airport = Counter(airports).most_common(1)[0][0] if airports else "N/A"

    recent = None
    if predictions:
        p = predictions[0]
        recent = {
            "prediction_id": p.id,
            "flight_number": p.flight_number,
            "carrier": p.carrier,
            "origin": p.origin,
            "destination": p.destination,
            "delay_probability": p.delay_probability,
            "risk_level": p.risk_level,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }

    stats = UserProfileStats(
        total_predictions=total_preds,
        delayed_predictions_count=delayed_preds,
        most_checked_airline=most_airline,
        most_checked_route=most_route,
        most_checked_airport=most_airport,
        recent_prediction=recent
    )

    return CustomerProfileResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone_number=current_user.phone_number,
        email_verified=current_user.email_verified,
        phone_verified=current_user.phone_verified,
        avatar_url=profile_db.avatar_url,
        account_created_at=current_user.created_at,
        preferred_airports=profile_db.preferred_airports or ["JFK", "LAX", "ORD"],
        preferred_routes=profile_db.preferred_routes or [{"origin": "JFK", "destination": "LAX"}],
        stats=stats
    )

@router.put("/profile", response_model=CustomerProfileResponse)
def update_profile(
    req: UpdateProfileRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates editable profile information (full_name, avatar, preferred airports/routes)."""
    try:
        update_user_profile(
            db,
            user_id=current_user.id,
            full_name=req.full_name,
            avatar_url=req.avatar_url,
            preferred_airports=req.preferred_airports,
            preferred_routes=req.preferred_routes
        )
        return get_profile(current_user=current_user, db=db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Profile update failed: {str(e)}")

@router.post("/profile/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Changes password for current user after verifying old password."""
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    update_user_password(db, current_user.id, req.new_password)
    return {"success": True, "message": "Password changed successfully."}
