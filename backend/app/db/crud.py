import hashlib
import os
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Dict, Any
from backend.app.db.models import (
    PredictionLogModel,
    ModelVersionModel,
    UserModel,
    UserProfileModel,
    SavedFlightModel,
    SavedRouteModel
)
from datetime import datetime

SALT = b"flightsense_secure_salt_v1"

def hash_password(password: str) -> str:
    """Hashes password using PBKDF2 HMAC SHA-256."""
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), SALT, 100000)
    return key.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored PBKDF2 hash."""
    return hash_password(plain_password) == hashed_password

def get_user_by_id(db: Session, user_id: int) -> Optional[UserModel]:
    """Finds user by user ID."""
    return db.query(UserModel).filter(UserModel.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[UserModel]:
    """Finds user by email address."""
    if not email:
        return None
    return db.query(UserModel).filter(UserModel.email == email.lower().strip()).first()

def get_user_by_phone(db: Session, phone_number: str) -> Optional[UserModel]:
    """Finds user by phone number."""
    if not phone_number:
        return None
    return db.query(UserModel).filter(UserModel.phone_number == phone_number.strip()).first()

def get_user_by_email_or_phone(db: Session, identifier: str) -> Optional[UserModel]:
    """Finds user by email address or phone number."""
    if not identifier:
        return None
    clean = identifier.strip()
    return db.query(UserModel).filter(
        or_(UserModel.email == clean.lower(), UserModel.phone_number == clean)
    ).first()

def create_user(db: Session, email: Optional[str] = None, password: str = "", full_name: Optional[str] = None) -> UserModel:
    """Creates a basic user record (legacy helper)."""
    return create_user_with_auth(db, email=email, password=password, full_name=full_name, email_verified=True)

def create_user_with_auth(
    db: Session,
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
    password: str = "",
    full_name: Optional[str] = None,
    email_verified: bool = False,
    phone_verified: bool = False
) -> UserModel:
    """Creates a new user record with email or phone registration."""
    clean_email = email.lower().strip() if email else f"user_{phone_number.replace('+', '').replace(' ', '')}@phone.user"
    clean_phone = phone_number.strip() if phone_number else None

    user = UserModel(
        email=clean_email,
        phone_number=clean_phone,
        hashed_password=hash_password(password),
        full_name=full_name,
        email_verified=email_verified,
        phone_verified=phone_verified,
        is_active=True,
        is_superuser=False,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize user profile
    profile = UserProfileModel(
        user_id=user.id,
        avatar_url=None,
        preferred_airports=["JFK", "LAX", "ORD"],
        preferred_routes=[{"origin": "JFK", "destination": "LAX"}],
        updated_at=datetime.utcnow()
    )
    db.add(profile)
    db.commit()

    return user

def get_or_create_user_profile(db: Session, user_id: int) -> UserProfileModel:
    """Fetches user profile or initializes if missing."""
    profile = db.query(UserProfileModel).filter(UserProfileModel.user_id == user_id).first()
    if not profile:
        profile = UserProfileModel(
            user_id=user_id,
            avatar_url=None,
            preferred_airports=["JFK", "LAX", "ORD"],
            preferred_routes=[{"origin": "JFK", "destination": "LAX"}],
            updated_at=datetime.utcnow()
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def update_user_profile(
    db: Session,
    user_id: int,
    full_name: Optional[str] = None,
    avatar_url: Optional[str] = None,
    preferred_airports: Optional[List[str]] = None,
    preferred_routes: Optional[List[Dict[str, str]]] = None
) -> UserModel:
    """Updates user profile and details."""
    user = get_user_id_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise ValueError("User not found.")

    if full_name is not None:
        user.full_name = full_name

    profile = get_or_create_user_profile(db, user_id)
    if avatar_url is not None:
        profile.avatar_url = avatar_url
    if preferred_airports is not None:
        profile.preferred_airports = preferred_airports
    if preferred_routes is not None:
        profile.preferred_routes = preferred_routes

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

def update_user_password(db: Session, user_id: int, new_password: str) -> bool:
    """Updates user password with PBKDF2 hash."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        return False
    user.hashed_password = hash_password(new_password)
    db.commit()
    return True

# Saved Flights CRUD
def get_saved_flights_by_user(db: Session, user_id: int) -> List[SavedFlightModel]:
    """Returns saved flights for given user."""
    return db.query(SavedFlightModel).filter(SavedFlightModel.user_id == user_id).order_by(SavedFlightModel.created_at.desc()).all()

def create_saved_flight(
    db: Session,
    user_id: int,
    flight_number: str,
    carrier: str,
    origin: str,
    destination: str,
    scheduled_departure: Optional[str] = None
) -> SavedFlightModel:
    """Saves a flight for authenticated user."""
    saved = SavedFlightModel(
        user_id=user_id,
        flight_number=flight_number.upper().strip(),
        carrier=carrier.upper().strip(),
        origin=origin.upper().strip(),
        destination=destination.upper().strip(),
        scheduled_departure=scheduled_departure,
        created_at=datetime.utcnow()
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved

def delete_saved_flight(db: Session, user_id: int, flight_id: int) -> bool:
    """Deletes a saved flight belonging to user."""
    saved = db.query(SavedFlightModel).filter(
        SavedFlightModel.id == flight_id,
        SavedFlightModel.user_id == user_id
    ).first()
    if not saved:
        return False
    db.delete(saved)
    db.commit()
    return True

# Prediction History CRUD
def create_prediction_log(db: Session, prediction_data: Dict[str, Any], user_id: Optional[int] = None) -> PredictionLogModel:
    """Inserts a new prediction record into database prediction_history."""
    db_obj = PredictionLogModel(
        id=prediction_data["prediction_id"],
        user_id=user_id or prediction_data.get("user_id"),
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
    flight_number: Optional[str] = None,
    user_id: Optional[int] = None
) -> List[PredictionLogModel]:
    """Queries prediction logs from prediction_history with pagination and filters."""
    query = db.query(PredictionLogModel)
    if user_id is not None:
        query = query.filter(PredictionLogModel.user_id == user_id)
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


