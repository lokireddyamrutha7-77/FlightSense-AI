from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class FlightPredictionRequest(BaseModel):
    flight_number: str = Field(..., json_schema_extra={"example": "AA-1042"})
    carrier: str = Field(..., json_schema_extra={"example": "AA"})
    origin: str = Field(..., json_schema_extra={"example": "JFK"})
    destination: str = Field(..., json_schema_extra={"example": "LAX"})
    scheduled_departure: str = Field(..., json_schema_extra={"example": "2026-09-25T14:30:00Z"})
    distance_miles: float = Field(..., json_schema_extra={"example": 2475.0})

class SHAPFeatureAttribution(BaseModel):
    feature: str
    shap_value: float
    impact: str
    feature_value: Optional[str] = None

class FlightPredictionResponse(BaseModel):
    prediction_id: str
    flight_number: str
    carrier: str
    origin: str
    destination: str
    delay_probability: float
    predicted_class: str  # DELAYED or ON TIME
    risk_level: str      # Low Risk, Moderate Risk, High Risk, Severe Risk
    is_delayed: bool
    is_mock_data: bool = False
    shap_summary: List[SHAPFeatureAttribution]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WhatIfSimulationRequest(FlightPredictionRequest):
    simulated_carrier: Optional[str] = Field(default=None, description="Simulated airline carrier code")
    simulated_origin: Optional[str] = Field(default=None, description="Simulated origin airport code")
    simulated_destination: Optional[str] = Field(default=None, description="Simulated destination airport code")
    simulated_scheduled_departure: Optional[str] = Field(default=None, description="Simulated departure timestamp")
    simulated_distance_miles: Optional[float] = Field(default=None, description="Simulated flight distance")

