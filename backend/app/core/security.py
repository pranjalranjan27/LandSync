# ==============================================================================
# Layer: Security & Cryptography (app/core/security.py)
# ALLOWED:
#   - Provide pure cryptographic and token functions: password hashing, password verification,
#     and JWT token creation/decoding.
# NOT ALLOWED:
#   - Never import database sessions, models, or repositories here.
#   - Never check user roles or permissions here (that belongs in api/dependencies.py and services/).
# ==============================================================================

from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

# CryptContext configured with bcrypt scheme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash from a plain-text password."""
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    claims: Optional[dict[str, Any]] = None
) -> str:
    """Create a signed JWT token containing subject and optional claims."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "iat": now,
        "sub": str(subject)
    }
    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate a JWT access token, returning the payload or None if invalid."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
