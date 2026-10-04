from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RequestOTPRequest(BaseModel):
    target: str = Field(..., description="Email address or phone number")
    target_type: str = Field(..., description="'email' or 'phone'")
    purpose: str = Field(default="signup", description="'signup' or 'reset_password'")

class RequestOTPResponse(BaseModel):
    success: bool
    message: str
    cooldown_seconds: int = 60
    dev_otp: Optional[str] = None  # Helper for local testing

class VerifySignupOTPRequest(BaseModel):
    target: str = Field(..., description="Email address or phone number")
    target_type: str = Field(..., description="'email' or 'phone'")
    otp_code: str = Field(..., description="6-digit verification OTP code")
    password: str = Field(..., min_length=6, description="Account password")
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    identifier: Optional[str] = Field(default=None, description="Email address or phone number")
    email: Optional[str] = Field(default=None, description="Email address fallback")
    phone_number: Optional[str] = Field(default=None, description="Phone number fallback")
    password: str = Field(..., description="Account password")

class ForgotPasswordRequest(BaseModel):
    target: str = Field(..., description="Registered email address or phone number")
    target_type: str = Field(..., description="'email' or 'phone'")

class ResetPasswordRequest(BaseModel):
    target: str = Field(..., description="Email address or phone number")
    otp_code: str = Field(..., description="6-digit verification OTP code")
    new_password: str = Field(..., min_length=6, description="New account password")

class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    email_verified: bool = False
    phone_verified: bool = False
    is_active: bool = True
    created_at: Optional[datetime] = None

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
