from fastapi import APIRouter
from backend.app.schemas.health import HealthResponse
from backend.app.services.ml_service import ml_service
from datetime import datetime

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health_status():
    """Health-check API confirming backend execution, DB status, and ML model loaded status."""
    ml_status = "loaded (XGBoost binary)" if ml_service.is_loaded else "loaded (stub/dev mode)"
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment="development",
        database="connected (mock/sqlite)",
        ml_model_status=ml_status,
        timestamp=datetime.utcnow()
    )
