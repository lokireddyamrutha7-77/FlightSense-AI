from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from backend.app.db.session import get_db
from backend.app.db.crud import get_prediction_history as db_get_history
from backend.app.api.v1.endpoints.auth import get_optional_current_user

router = APIRouter()

@router.get("/history")
def get_prediction_history(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    carrier: Optional[str] = Query(default=None),
    risk_level: Optional[str] = Query(default=None),
    flight_number: Optional[str] = Query(default=None),
    mine_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user = Depends(get_optional_current_user)
) -> List[Dict[str, Any]]:
    """Returns historical logged predictions from database with filtering, pagination, and user isolation."""
    filter_user_id = None
    if current_user and mine_only:
        filter_user_id = current_user.id

    logs = db_get_history(
        db=db,
        skip=skip,
        limit=limit,
        carrier=carrier,
        risk_level=risk_level,
        flight_number=flight_number,
        user_id=filter_user_id
    )
    
    results = []
    for log in logs:
        results.append({
            "prediction_id": log.id,
            "user_id": log.user_id,
            "flight_number": log.flight_number,
            "carrier": log.carrier,
            "origin": log.origin,
            "destination": log.destination,
            "scheduled_departure": log.scheduled_departure,
            "delay_probability": log.delay_probability,
            "risk_level": log.risk_level,
            "predicted_delay_minutes": log.predicted_delay_minutes,
            "is_delayed": log.is_delayed,
            "is_mock_data": log.is_mock_data,
            "shap_summary": log.shap_summary or [],
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    return results

