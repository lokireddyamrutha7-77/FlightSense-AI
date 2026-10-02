from fastapi import APIRouter
from backend.app.schemas.intelligence import AirportIntelligenceResponse
from backend.app.services.data_service import data_service

router = APIRouter()

@router.get("/airports/intelligence", response_model=AirportIntelligenceResponse)
def get_airport_intelligence():
    """Returns airport congestion scores, average arrival/departure delays, and weather impacts."""
    return data_service.get_airport_intelligence()
