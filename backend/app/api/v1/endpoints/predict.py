from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.prediction import (
    FlightPredictionRequest,
    FlightPredictionResponse,
    WhatIfSimulationRequest,
)
from backend.app.services.ml_service import ml_service

router = APIRouter()

@router.post("/predict", response_model=FlightPredictionResponse)
def predict_flight_delay(request: FlightPredictionRequest, db: Session = Depends(get_db)):
    """
    Predicts flight delay probability, expected delay minutes, risk level,
    and SHAP key factor attributions using the real ML model, and logs prediction to DB.
    """
    try:
        return ml_service.predict_delay(request, db_session=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/predict/what-if")
def simulate_what_if_scenario(request: WhatIfSimulationRequest, db: Session = Depends(get_db)):
    """
    Simulates pre-flight parameter shifts (departure time, airline, origin, destination, distance)
    to evaluate real impact on delay probability.
    """
    try:
        return ml_service.simulate_what_if(request, db_session=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
