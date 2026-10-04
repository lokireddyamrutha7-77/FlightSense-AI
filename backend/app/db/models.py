from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone_number = Column(String(50), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("UserProfileModel", back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_flights = relationship("SavedFlightModel", back_populates="user", cascade="all, delete-orphan")
    prediction_history = relationship("PredictionLogModel", back_populates="user", cascade="all, delete-orphan")


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    preferred_airports = Column(JSON, nullable=True)
    preferred_routes = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserModel", back_populates="profile")


class OTPVerificationModel(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    target = Column(String(255), index=True, nullable=False)  # email address or phone number
    target_type = Column(String(20), nullable=False)          # "email" or "phone"
    otp_code_hash = Column(String(255), nullable=False)
    purpose = Column(String(50), nullable=False)              # "signup" or "reset_password"
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SavedFlightModel(Base):
    __tablename__ = "saved_flights"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    flight_number = Column(String(20), nullable=False)
    carrier = Column(String(10), nullable=False)
    origin = Column(String(10), nullable=False)
    destination = Column(String(10), nullable=False)
    scheduled_departure = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserModel", back_populates="saved_flights")


class SavedRouteModel(Base):
    __tablename__ = "saved_routes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    origin = Column(String(10), nullable=False)
    destination = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PredictionLogModel(Base):
    __tablename__ = "prediction_history"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
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

    user = relationship("UserModel", back_populates="prediction_history")


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

