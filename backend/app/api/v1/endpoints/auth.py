import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.crud import get_user_by_email, create_user, verify_password

router = APIRouter()

SECRET_KEY = "flightsense-jwt-secret-key-production-ready-32bytes"
ALGORITHM = "HS256"

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

def create_jwt_token(email: str, user_id: int) -> str:
    payload = {
        "sub": email,
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/auth/register", response_model=AuthTokenResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user with securely hashed password."""
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    
    existing = get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    user = create_user(db, email=req.email, password=req.password, full_name=req.full_name)
    token = create_jwt_token(user.email, user.id)

    return AuthTokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_active=user.is_active)
    )

@router.post("/auth/login", response_model=AuthTokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates user credentials and issues JWT token."""
    user = get_user_by_email(db, req.email)
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = create_jwt_token(user.email, user.id)
    return AuthTokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_active=user.is_active)
    )

@router.get("/auth/me", response_model=UserResponse)
def get_current_user_profile(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Returns profile for currently authenticated user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Bearer token.")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = get_user_by_email(db, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        return UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_active=user.is_active)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token session.")
