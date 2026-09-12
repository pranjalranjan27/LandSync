# ==============================================================================
# Layer: Services — Attribute-Based Access Control / ABAC (app/services/jurisdiction.py)
# ALLOWED:
#   - Evaluate user jurisdiction scope against target entity district_id and state_id.
#   - Enforce 403 Forbidden on jurisdiction mismatches.
# NOT ALLOWED:
#   - NO raw database queries (pass resolved IDs into these functions).
#   - NO route definition or response rendering.
# ==============================================================================

from typing import Optional
from fastapi import HTTPException, status

from app.models.enums import JurisdictionLevel
from app.models.user import User


def check_user_jurisdiction(
    user: User,
    district_id: Optional[int] = None,
    state_id: Optional[int] = None
) -> bool:
    """
    Attribute-Based Access Control (ABAC) evaluation.
    - 'national' level: Unrestricted access across all states and districts.
    - 'state' level: Access granted only if entity's state_id matches user's jurisdiction_id.
    - 'district' level: Access granted only if entity's district_id matches user's jurisdiction_id.
    """
    if user.jurisdiction_level == JurisdictionLevel.NATIONAL.value:
        return True

    if user.jurisdiction_level == JurisdictionLevel.STATE.value:
        if state_id is not None:
            return user.jurisdiction_id == state_id
        return False

    if user.jurisdiction_level == JurisdictionLevel.DISTRICT.value:
        if district_id is not None:
            return user.jurisdiction_id == district_id
        return False

    return False


def enforce_jurisdiction(
    user: User,
    district_id: Optional[int] = None,
    state_id: Optional[int] = None
) -> None:
    """
    Enforces that the user has legitimate jurisdiction over the specified district or state.
    Raises HTTPException(403 Forbidden) if the user lacks authority.
    """
    if not check_user_jurisdiction(user, district_id=district_id, state_id=state_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Forbidden: User '{user.name}' ({user.role}) with {user.jurisdiction_level} jurisdiction "
                f"(ID: {user.jurisdiction_id}) lacks authority over district {district_id} / state {state_id}."
            )
        )
