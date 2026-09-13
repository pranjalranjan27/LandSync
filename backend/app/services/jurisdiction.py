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
    state_id: Optional[int] = None,
    tehsil: Optional[str] = None,
    village: Optional[str] = None
) -> bool:
    """
    Attribute-Based Access Control (ABAC) evaluation.
    - 'national' level: Unrestricted access across all states, districts, and revenue circles.
    - 'state' level: Access granted only if entity's state_id matches user's jurisdiction_id.
    - 'district' level: Access granted only if entity's district_id matches user's jurisdiction_id.
    - 'tehsil' level: Access granted only if entity's tehsil matches user's assigned tehsil.
    - 'village' level: Access granted only if entity's village matches user's assigned village(s).
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

    if user.jurisdiction_level == JurisdictionLevel.TEHSIL.value:
        if tehsil is not None and user.jurisdiction_value:
            return user.jurisdiction_value.strip().lower() == tehsil.strip().lower()
        # Fallback to district check if district_id provided
        if district_id is not None and user.jurisdiction_id is not None:
            return user.jurisdiction_id == district_id
        return False

    if user.jurisdiction_level == JurisdictionLevel.VILLAGE.value:
        if village is not None and user.jurisdiction_value:
            assigned = [v.strip().lower() for v in user.jurisdiction_value.split(",")]
            return village.strip().lower() in assigned
        if district_id is not None and user.jurisdiction_id is not None:
            return user.jurisdiction_id == district_id
        return False

    return False


def enforce_jurisdiction(
    user: User,
    district_id: Optional[int] = None,
    state_id: Optional[int] = None,
    tehsil: Optional[str] = None,
    village: Optional[str] = None
) -> None:
    """
    Enforces that the user has legitimate jurisdiction over the specified geography.
    Raises HTTPException(403 Forbidden) if the user lacks authority.
    """
    if not check_user_jurisdiction(user, district_id=district_id, state_id=state_id, tehsil=tehsil, village=village):
        scope_info = f"ID: {user.jurisdiction_id}" if user.jurisdiction_id else f"Value: '{user.jurisdiction_value}'"
        target_info = f"district {district_id}, state {state_id}, tehsil '{tehsil}', village '{village}'"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Forbidden: User '{user.name}' ({user.role}) with {user.jurisdiction_level} jurisdiction "
                f"({scope_info}) lacks authority over {target_info}."
            )
        )
