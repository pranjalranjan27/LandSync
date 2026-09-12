# ==============================================================================
# Layer: API Routes — Authentication (app/api/routes/auth.py)
# ALLOWED:
#   - Parse login and current user requests, validate inputs with Pydantic, and
#     invoke AuthService.
# NOT ALLOWED:
#   - NEVER import or execute repository functions or SQL queries directly in routes.
#   - NO password verification logic directly in routers.
# ==============================================================================

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserLogin, Token, UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
def login(
    payload: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user with email and password, returning signed JWT access token."""
    return AuthService.authenticate_user(db=db, email=payload.email, password=payload.password)


@router.get("/me", response_model=UserRead, status_code=status.HTTP_200_OK)
def read_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return identity and jurisdiction details for the currently authenticated user."""
    return AuthService.get_user_profile(db=db, user_id=current_user.id)
