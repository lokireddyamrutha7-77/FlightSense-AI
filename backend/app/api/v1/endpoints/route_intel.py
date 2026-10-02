from fastapi import APIRouter
from backend.app.schemas.intelligence import RouteIntelligenceResponse
from backend.app.services.data_service import data_service

router = APIRouter()

@router.get("/routes/intelligence", response_model=RouteIntelligenceResponse)
def get_route_intelligence():
    """Returns route bottleneck rankings, delay risk scores, and on-time performance."""
    return data_service.get_route_intelligence()
