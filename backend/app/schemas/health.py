from pydantic import BaseModel, Field
from datetime import datetime

class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    version: str = Field(..., example="1.0.0")
    environment: str = Field(..., example="development")
    database: str = Field(..., example="connected (mock)")
    ml_model_status: str = Field(..., example="loaded (stub)")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
