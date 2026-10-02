from fastapi import APIRouter
from backend.app.schemas.analytics import ModelPerformanceMetrics
from backend.app.services.data_service import data_service

router = APIRouter()

@router.get("/model/performance", response_model=ModelPerformanceMetrics)
def get_model_performance():
    """Returns ML model metrics including ROC-AUC, F1, Precision/Recall, and Confusion Matrix."""
    return data_service.get_model_performance()
