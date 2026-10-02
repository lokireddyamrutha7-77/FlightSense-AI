from fastapi import APIRouter
from backend.app.schemas.intelligence import AirlineIntelligenceResponse
from backend.app.services.data_service import data_service

router = APIRouter()

@router.get("/airlines/intelligence", response_model=AirlineIntelligenceResponse)
def get_airline_intelligence():
    """Returns carrier on-time performance (OTP), delay shares, and fleet reliability scores."""
    return data_service.get_airline_intelligence()
