from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class MonthlyTrend(BaseModel):
    month: str
    total_flights: int
    delayed_flights: int
    avg_delay_minutes: float
    delay_rate: float

class HourlyDistribution(BaseModel):
    hour: int
    flight_count: int
    delay_probability: float

class CauseBreakdown(BaseModel):
    cause: str
    percentage: float
    avg_minutes: float

class AnalyticsOverviewResponse(BaseModel):
    total_flights_analyzed: int
    overall_delay_rate: float
    avg_delay_minutes: float
    top_delay_reason: str
    monthly_trends: List[MonthlyTrend]
    hourly_distribution: List[HourlyDistribution]
    cause_breakdown: List[CauseBreakdown]
    is_mock_data: bool = True

class ModelPerformanceMetrics(BaseModel):
    model_version: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float = 0.0
    selected_decision_threshold: float = 0.53
    production_model_name: str = "XGBoost"
    mae_minutes: float = 6.4
    confusion_matrix: Dict[str, int]
    feature_importances: List[Dict[str, Any]]
    candidate_models_comparison: Optional[Dict[str, Any]] = None
    is_mock_data: bool = False

