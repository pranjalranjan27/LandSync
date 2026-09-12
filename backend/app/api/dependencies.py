# ==============================================================================
# Layer: API Dependencies — RBAC & ABAC Security Gates (app/api/dependencies.py)
# ALLOWED:
#   - Implement reusable FastAPI security dependencies: get_current_user, require_role,
#     and require_jurisdiction_match.
#   - Combine role tag (RBAC) and jurisdiction attribute (ABAC) on every protected request.
# NOT ALLOWED:
#   - NO route endpoint definitions here.
#   - NO direct business mutation logic (delegate to services/).
# ==============================================================================

from typing import Callable, List, Optional, Union
from fastapi import Depends, HTTPException, Path, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import decode_access_token
from app.models.enums import UserRole, JurisdictionLevel
from app.models.user import User
from app.models.case import Case
from app.models.parcel import Parcel
from app.repositories.user_repo import UserRepository
from app.repositories.case_repo import CaseRepository
from app.repositories.parcel_repo import ParcelRepository
from app.services.jurisdiction import enforce_jurisdiction, check_user_jurisdiction

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Authenticates bearer JWT token and extracts authenticated User entity.
    Raises HTTPException(401 Unauthorized) if token is invalid or expired.
    """
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials: invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = UserRepository.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_role(*allowed_roles: Union[UserRole, str]) -> Callable[[User], User]:
    """
    Reusable RBAC dependency factory.
    Enforces that caller holds at least one of the specified roles.
    Example: Depends(require_role(UserRole.DISTRICT_COLLECTOR, UserRole.STATE_APPROVER))
    """
    role_values = [r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles]

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires one of roles: {role_values}. User holds '{current_user.role}'."
            )
        return current_user

    return role_checker


def require_jurisdiction_match(entity_type: str = "case"):
    """
    Reusable ABAC dependency factory.
    Inspects URL path parameter 'id' (case_id or parcel_id) and validates that the
    authenticated user has jurisdiction over the entity's district or state.
    """
    def jurisdiction_checker(
        id: int = Path(..., description=f"The {entity_type} ID to verify jurisdiction for"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if current_user.jurisdiction_level == JurisdictionLevel.NATIONAL.value:
            return current_user

        if entity_type == "case":
            case = CaseRepository.get_case_by_id(db, id)
            if not case:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{id} not found.")
            enforce_jurisdiction(current_user, district_id=case.district_id, state_id=case.state_id)

        elif entity_type == "parcel":
            parcel = ParcelRepository.get_parcel_by_id(db, id)
            if not parcel:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Parcel #{id} not found.")
            enforce_jurisdiction(current_user, district_id=parcel.district_id)

        return current_user

    return jurisdiction_checker
