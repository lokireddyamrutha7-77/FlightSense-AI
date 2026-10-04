import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from backend.app.db.models import OTPVerificationModel, UserModel, UserProfileModel

logger = logging.getLogger("OTPService")

OTP_EXPIRATION_MINUTES = 10
RESEND_COOLDOWN_SECONDS = 60
MAX_OTP_ATTEMPTS = 5
SALT = b"flightsense_otp_salt_v1"

def hash_otp(code: str) -> str:
    """Hashes a 6-digit OTP code using SHA-256."""
    return hashlib.sha256(SALT + code.encode("utf-8")).hexdigest()

def generate_otp_code() -> str:
    """Generates a secure 6-digit numeric OTP code."""
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(6))

class OTPProviderService:
    """
    Extensible OTP Dispatcher Service.
    Integrates with external Email (e.g. SendGrid/SES) or SMS (e.g. Twilio) gateways.
    In development mode, logs OTP securely to system output.
    """
    @staticmethod
    def send_otp(target: str, target_type: str, code: str, purpose: str) -> bool:
        if target_type == "email":
            logger.info(f"[OTP PROVIDER] [EMAIL] Sending verification OTP {code} to {target} (Purpose: {purpose})")
        else:
            logger.info(f"[OTP PROVIDER] [SMS] Sending verification OTP {code} to phone {target} (Purpose: {purpose})")
        
        # Real provider integration hooks can be added here
        return True


def request_otp(
    db: Session,
    target: str,
    target_type: str,
    purpose: str
) -> Tuple[bool, str, Optional[str]]:
    """
    Generates and records an OTP verification entry with cooldown & attempt limits.
    Returns: (success: bool, message: str, dev_otp: Optional[str])
    """
    clean_target = target.strip().lower() if target_type == "email" else target.strip()
    
    # Check existing recent active OTP for cooldown
    recent = (
        db.query(OTPVerificationModel)
        .filter(
            OTPVerificationModel.target == clean_target,
            OTPVerificationModel.purpose == purpose,
            OTPVerificationModel.is_used == False
        )
        .order_by(OTPVerificationModel.created_at.desc())
        .first()
    )

    now = datetime.utcnow()
    if recent:
        seconds_since = (now - recent.created_at).total_seconds()
        if seconds_since < RESEND_COOLDOWN_SECONDS:
            remaining = int(RESEND_COOLDOWN_SECONDS - seconds_since)
            return False, f"Please wait {remaining} seconds before requesting a new OTP.", None

    otp_code = generate_otp_code()
    otp_hash = hash_otp(otp_code)
    expires_at = now + timedelta(minutes=OTP_EXPIRATION_MINUTES)

    otp_entry = OTPVerificationModel(
        target=clean_target,
        target_type=target_type,
        otp_code_hash=otp_hash,
        purpose=purpose,
        attempts=0,
        max_attempts=MAX_OTP_ATTEMPTS,
        is_used=False,
        expires_at=expires_at,
        created_at=now
    )
    db.add(otp_entry)
    db.commit()
    db.refresh(otp_entry)

    # Dispatch OTP via provider
    OTPProviderService.send_otp(clean_target, target_type, otp_code, purpose)

    # Return dev_otp for local testing convenience
    return True, f"OTP verification code sent to {clean_target}.", otp_code


def verify_otp(
    db: Session,
    target: str,
    otp_code: str,
    purpose: str
) -> Tuple[bool, str]:
    """
    Verifies user-provided 6-digit OTP code against stored hash.
    Enforces single-use, max attempts, and expiration.
    """
    clean_target = target.strip().lower() if "@" in target else target.strip()
    now = datetime.utcnow()

    entry = (
        db.query(OTPVerificationModel)
        .filter(
            OTPVerificationModel.target == clean_target,
            OTPVerificationModel.purpose == purpose,
            OTPVerificationModel.is_used == False
        )
        .order_by(OTPVerificationModel.created_at.desc())
        .first()
    )

    if not entry:
        return False, "No active OTP request found for this account. Please request a new OTP."

    if entry.expires_at < now:
        entry.is_used = True
        db.commit()
        return False, "OTP has expired. Please request a new verification code."

    if entry.attempts >= entry.max_attempts:
        entry.is_used = True
        db.commit()
        return False, "Maximum invalid attempts exceeded. Please request a new OTP."

    # Increment attempt count
    entry.attempts += 1
    db.commit()

    if hash_otp(otp_code.strip()) != entry.otp_code_hash:
        remaining_attempts = entry.max_attempts - entry.attempts
        return False, f"Invalid OTP code. {remaining_attempts} attempts remaining."

    # Mark as successfully used
    entry.is_used = True
    db.commit()
    return True, "OTP verified successfully."
