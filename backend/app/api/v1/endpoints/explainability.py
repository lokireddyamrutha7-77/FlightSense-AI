from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.app.db.session import get_db
from backend.app.db.crud import get_prediction_by_id

router = APIRouter()

@router.get("/explain/{prediction_id}")
def get_prediction_shap_explanation(prediction_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns detailed SHAP feature attributions for a specific logged prediction ID."""
    log = get_prediction_by_id(db, prediction_id)
    if not log:
        # If prediction ID not found in DB logs, return informative error or fallback structure
        raise HTTPException(status_code=404, detail=f"Prediction ID '{prediction_id}' not found in database logs.")

    shap_values = log.shap_summary or []
    return {
        "prediction_id": log.id,
        "flight_number": log.flight_number,
        "carrier": log.carrier,
        "origin": log.origin,
        "destination": log.destination,
        "delay_probability": log.delay_probability,
        "risk_level": log.risk_level,
        "predicted_delay_minutes": log.predicted_delay_minutes,
        "is_delayed": log.is_delayed,
        "is_mock_data": log.is_mock_data,
        "shap_summary": shap_values,
        "created_at": log.created_at.isoformat() if log.created_at else None
    }
