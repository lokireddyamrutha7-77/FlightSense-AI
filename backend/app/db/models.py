from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from datetime import datetime
from backend.app.db.session import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PredictionLogModel(Base):
    __tablename__ = "prediction_history"

    id = Column(String(50), primary_key=True, index=True)
    flight_number = Column(String(20), nullable=False, index=True)
    carrier = Column(String(10), nullable=False, index=True)
    origin = Column(String(10), nullable=False)
    destination = Column(String(10), nullable=False)
    scheduled_departure = Column(String(50), nullable=True)
    distance_miles = Column(Float, nullable=True)
    delay_probability = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False, index=True)
    predicted_delay_minutes = Column(Float, nullable=True, default=0.0)
    is_delayed = Column(Boolean, nullable=False)
    is_mock_data = Column(Boolean, default=False)
    input_features = Column(JSON, nullable=True)
    shap_summary = Column(JSON, nullable=True)
    actual_delay_minutes = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ModelVersionModel(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_version = Column(String(100), unique=True, nullable=False)
    architecture = Column(String(100), nullable=False)
    accuracy = Column(Float, nullable=True)
    precision_score = Column(Float, nullable=True)
    recall_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    pr_auc = Column(Float, nullable=True)
    parameters = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    trained_at = Column(DateTime, default=datetime.utcnow)
