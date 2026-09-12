# ==============================================================================
# Layer: Services — Authentication & Token Generation (app/services/auth_service.py)
# ALLOWED:
#   - Authenticate credentials against password hashes, create JWT tokens with claims,
#     and format User profiles.
# NOT ALLOWED:
#   - NO raw SQL generation (delegate to repositories/user_repo.py).
#   - NO cryptographic primitives implemented here (delegate to core/security.py).
# ==============================================================================

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import Token, UserRead


class AuthService:
    """Service handling identity verification and JWT credential distribution."""

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Token:
        """
        Authenticates user email and password.
        Issues a signed JWT containing user ID, role, and jurisdiction claims.
        """
        user = UserRepository.get_user_by_email(db, email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Please verify email and password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        claims = {
            "role": user.role,
            "jurisdiction_level": user.jurisdiction_level,
            "jurisdiction_id": user.jurisdiction_id,
        }

        access_token = create_access_token(
            subject=user.id,
            claims=claims
        )

        user_read = UserRead.model_validate(user)
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_read
        )

    @staticmethod
    def get_user_profile(db: Session, user_id: int) -> UserRead:
        """Retrieves verified user profile."""
        user = UserRepository.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found."
            )
        return UserRead.model_validate(user)
