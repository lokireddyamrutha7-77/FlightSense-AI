from fastapi import APIRouter
from backend.app.schemas.analytics import AnalyticsOverviewResponse
from backend.app.services.data_service import data_service

router = APIRouter()

@router.get("/analytics/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview():
    """Returns overall EDA delay trends, monthly/hourly distributions, and cause breakdowns."""
    return data_service.get_analytics_overview()
