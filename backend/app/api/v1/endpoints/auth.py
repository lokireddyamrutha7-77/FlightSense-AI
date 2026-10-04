import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.db.crud import (
    get_user_by_email,
    get_user_by_phone,
    get_user_by_email_or_phone,
    get_user_by_id,
    create_user_with_auth,
    verify_password,
    update_user_password,
)
from backend.app.services.otp_service import request_otp, verify_otp
from backend.app.schemas.auth import (
    RequestOTPRequest,
    RequestOTPResponse,
    VerifySignupOTPRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
    AuthTokenResponse,
)

router = APIRouter()

SECRET_KEY = "flightsense-jwt-secret-key-production-ready-32bytes"
ALGORITHM = "HS256"

def create_jwt_token(email: Optional[str], user_id: int) -> str:
    payload = {
        "sub": email or str(user_id),
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """FastAPI Dependency for authenticating JWT tokens."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authentication token.")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
        
        user = get_user_by_id(db, user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive or disabled.")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired or corrupted session token.")

def get_optional_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Optional user dependency for endpoints that work both logged in and guest."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id:
            return get_user_by_id(db, user_id)
    except Exception:
        pass
    return None

# LEGACY REGISTER ENDPOINT for backwards compatibility with tests & direct email signup
class LegacyRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


@router.post("/auth/register", response_model=AuthTokenResponse)
def register_user_legacy(req: LegacyRegisterRequest, db: Session = Depends(get_db)):
    """Direct user registration with email for backward compatibility."""
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    
    existing = get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    user = create_user_with_auth(db, email=req.email, password=req.password, full_name=req.full_name, email_verified=True)
    token = create_jwt_token(user.email, user.id)

    return AuthTokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            phone_number=user.phone_number,
            full_name=user.full_name,
            email_verified=user.email_verified,
            phone_verified=user.phone_verified,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )

# 1. OTP REQUEST FOR SIGNUP
@router.post("/auth/signup/request-otp", response_model=RequestOTPResponse)
def request_signup_otp(req: RequestOTPRequest, db: Session = Depends(get_db)):
    """Requests a 6-digit OTP for Email or Phone registration."""
    target_clean = req.target.strip()
    if req.target_type == "email":
        if "@" not in target_clean:
            raise HTTPException(status_code=400, detail="Please enter a valid email address.")
        if get_user_by_email(db, target_clean):
            raise HTTPException(status_code=400, detail="This email is already registered. Please sign in.")
    elif req.target_type == "phone":
        if len(target_clean) < 7:
            raise HTTPException(status_code=400, detail="Please enter a valid phone number.")
        if get_user_by_phone(db, target_clean):
            raise HTTPException(status_code=400, detail="This phone number is already registered. Please sign in.")
    else:
        raise HTTPException(status_code=400, detail="Target type must be 'email' or 'phone'.")

    success, message, dev_otp = request_otp(db, target=target_clean, target_type=req.target_type, purpose="signup")
    if not success:
        raise HTTPException(status_code=429, detail=message)

    return RequestOTPResponse(success=True, message=message, cooldown_seconds=60, dev_otp=dev_otp)

# 2. OTP VERIFY & SIGNUP CREATION
@router.post("/auth/signup/verify-otp", response_model=AuthTokenResponse)
def verify_signup_otp(req: VerifySignupOTPRequest, db: Session = Depends(get_db)):
    """Verifies OTP and completes Email or Phone account creation."""
    target_clean = req.target.strip()
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    verified, message = verify_otp(db, target=target_clean, otp_code=req.otp_code, purpose="signup")
    if not verified:
        raise HTTPException(status_code=400, detail=message)

    email = target_clean if req.target_type == "email" else None
    phone_number = target_clean if req.target_type == "phone" else None

    user = create_user_with_auth(
        db,
        email=email,
        phone_number=phone_number,
        password=req.password,
        full_name=req.full_name,
        email_verified=req.target_type == "email",
        phone_verified=req.target_type == "phone"
    )

    token = create_jwt_token(user.email, user.id)
    return AuthTokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            phone_number=user.phone_number,
            full_name=user.full_name,
            email_verified=user.email_verified,
            phone_verified=user.phone_verified,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )

# 3. LOGIN (Email OR Phone)
@router.post("/auth/login", response_model=AuthTokenResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates user credentials using email OR phone number."""
    target_id = req.identifier or req.email or req.phone_number
    if not target_id:
        raise HTTPException(status_code=400, detail="Please provide an email or phone number.")

    user = get_user_by_email_or_phone(db, target_id)
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email/phone number or password.")

    token = create_jwt_token(user.email, user.id)
    return AuthTokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            phone_number=user.phone_number,
            full_name=user.full_name,
            email_verified=user.email_verified,
            phone_verified=user.phone_verified,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )

# 4. FORGOT PASSWORD REQUEST
@router.post("/auth/forgot-password", response_model=RequestOTPResponse)
def forgot_password_request(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Requests a password reset OTP code."""
    target_clean = req.target.strip()
    user = get_user_by_email_or_phone(db, target_clean)
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with that email or phone number.")

    success, message, dev_otp = request_otp(db, target=target_clean, target_type=req.target_type, purpose="reset_password")
    if not success:
        raise HTTPException(status_code=429, detail=message)

    return RequestOTPResponse(success=True, message=message, cooldown_seconds=60, dev_otp=dev_otp)

# 5. RESET PASSWORD WITH OTP
@router.post("/auth/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verifies password reset OTP and updates user password."""
    target_clean = req.target.strip()
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    verified, message = verify_otp(db, target=target_clean, otp_code=req.otp_code, purpose="reset_password")
    if not verified:
        raise HTTPException(status_code=400, detail=message)

    user = get_user_by_email_or_phone(db, target_clean)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    update_user_password(db, user.id, req.new_password)
    return {"success": True, "message": "Password reset successfully. You can now log in with your new password."}

# 6. CURRENT USER PROFILE
@router.get("/auth/me", response_model=UserResponse)
def get_current_user_profile(current_user=Depends(get_current_user)):
    """Returns profile for currently authenticated user."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        phone_number=current_user.phone_number,
        full_name=current_user.full_name,
        email_verified=current_user.email_verified,
        phone_verified=current_user.phone_verified,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )
