from pydantic import BaseModel
from typing import List, Dict, Any

class RouteIntelItem(BaseModel):
    route_id: str
    origin: str
    destination: str
    total_flights: int
    avg_delay_minutes: float
    delay_risk_score: float
    on_time_percentage: float
    bottleneck_rank: int

class RouteIntelligenceResponse(BaseModel):
    routes: List[RouteIntelItem]
    top_bottlenecks: List[RouteIntelItem]
    is_mock_data: bool = True

class AirportIntelItem(BaseModel):
    code: str
    name: str
    city: str
    avg_dep_delay: float
    avg_arr_delay: float
    congestion_score: float  # 0 to 100
    weather_impact_level: str  # Low, Medium, High

class AirportIntelligenceResponse(BaseModel):
    airports: List[AirportIntelItem]
    is_mock_data: bool = True

class AirlineIntelItem(BaseModel):
    code: str
    name: str
    on_time_performance: float  # Percentage e.g. 84.5
    avg_delay_minutes: float
    carrier_delay_share: float
    fleet_reliability_rating: str  # A+, A, B, C

class AirlineIntelligenceResponse(BaseModel):
    airlines: List[AirlineIntelItem]
    is_mock_data: bool = True
