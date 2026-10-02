import hashlib
import os
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from backend.app.db.models import PredictionLogModel, ModelVersionModel, UserModel
from datetime import datetime

SALT = b"flightsense_secure_salt_v1"

def hash_password(password: str) -> str:
    """Hashes password using PBKDF2 HMAC SHA-256."""
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), SALT, 100000)
    return key.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored PBKDF2 hash."""
    return hash_password(plain_password) == hashed_password

def get_user_by_email(db: Session, email: str) -> Optional[UserModel]:
    """Finds user by email address."""
    return db.query(UserModel).filter(UserModel.email == email.lower().strip()).first()

def create_user(db: Session, email: str, password: str, full_name: Optional[str] = None) -> UserModel:
    """Creates a new user record with securely hashed password."""
    user = UserModel(
        email=email.lower().strip(),
        hashed_password=hash_password(password),
        full_name=full_name,
        is_active=True,
        is_superuser=False,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_prediction_log(db: Session, prediction_data: Dict[str, Any]) -> PredictionLogModel:
    """Inserts a new prediction record into database prediction_history."""
    db_obj = PredictionLogModel(
        id=prediction_data["prediction_id"],
        flight_number=prediction_data.get("flight_number", "UNKNOWN"),
        carrier=prediction_data.get("carrier", "N/A"),
        origin=prediction_data.get("origin", "N/A"),
        destination=prediction_data.get("destination", "N/A"),
        scheduled_departure=str(prediction_data.get("scheduled_departure", "")),
        distance_miles=float(prediction_data.get("distance_miles", 0)),
        delay_probability=float(prediction_data["delay_probability"]),
        risk_level=prediction_data["risk_level"],
        predicted_delay_minutes=float(prediction_data.get("predicted_delay_minutes", 0.0) or 0.0),
        is_delayed=bool(prediction_data["is_delayed"]),
        is_mock_data=bool(prediction_data.get("is_mock_data", False)),
        input_features=prediction_data.get("input_features"),
        shap_summary=prediction_data.get("shap_summary"),
        created_at=datetime.utcnow()
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_prediction_history(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    carrier: Optional[str] = None,
    risk_level: Optional[str] = None,
    flight_number: Optional[str] = None
) -> List[PredictionLogModel]:
    """Queries prediction logs from prediction_history with pagination and filters."""
    query = db.query(PredictionLogModel)
    if carrier:
        query = query.filter(PredictionLogModel.carrier == carrier)
    if risk_level:
        query = query.filter(PredictionLogModel.risk_level == risk_level)
    if flight_number:
        query = query.filter(PredictionLogModel.flight_number.ilike(f"%{flight_number}%"))
    
    return query.order_by(PredictionLogModel.created_at.desc()).offset(skip).limit(limit).all()


def get_prediction_by_id(db: Session, pred_id: str) -> Optional[PredictionLogModel]:
    """Fetches a specific prediction log by ID."""
    return db.query(PredictionLogModel).filter(PredictionLogModel.id == pred_id).first()


def record_model_version(db: Session, version_data: Dict[str, Any]) -> ModelVersionModel:
    """Inserts or updates active model version metrics into model_versions."""
    db.query(ModelVersionModel).update({"is_active": False})
    db_obj = ModelVersionModel(
        model_version=version_data["model_version"],
        architecture=version_data["architecture"],
        accuracy=version_data.get("accuracy"),
        precision_score=version_data.get("precision"),
        recall_score=version_data.get("recall"),
        f1_score=version_data.get("f1_score"),
        roc_auc=version_data.get("roc_auc"),
        pr_auc=version_data.get("pr_auc"),
        parameters=version_data.get("parameters"),
        is_active=True,
        trained_at=datetime.utcnow()
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

