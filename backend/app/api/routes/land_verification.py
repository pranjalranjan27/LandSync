# ==============================================================================
# Layer: API Routes — Section 4 Land Verification (app/api/routes/land_verification.py)
# ALLOWED:
#   - Define HTTP endpoints for Patwari/Lekhpal submission and Tehsildar certification.
#   - Attach RBAC dependencies (require_role) and extract authenticated user.
# NOT ALLOWED:
#   - NO raw SQL or repository logic here (delegate to LandVerificationService).
# ==============================================================================

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.land_verification import (
    LandVerificationCreate,
    LandVerificationRead,
    LandVerificationReturn
)
from app.services.land_verification_service import LandVerificationService
from app.api.dependencies import get_current_user, require_role

router = APIRouter(tags=["Land Verification"])


@router.post(
    "/cases/{case_id}/land-verification",
    response_model=LandVerificationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit on-ground land verification facts (Patwari / Lekhpal only)",
    dependencies=[Depends(require_role(UserRole.PATWARI_LEKHPAL))]
)
def submit_land_verification(
    case_id: int,
    payload: LandVerificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits cadastral ground-truthing, Khasra ownership verification, boundary survey,
    and asset enumeration (trees, crops, structures, wells, fences) for a case.
    Scoped strictly to the Patwari/Lekhpal's assigned village.
    """
    return LandVerificationService.submit_verification(
        db=db,
        case_id=case_id,
        data=payload,
        officer_user=current_user
    )


@router.patch(
    "/land-verification/{record_id}/certify",
    response_model=LandVerificationRead,
    status_code=status.HTTP_200_OK,
    summary="Certify land verification (Tehsildar only)",
    dependencies=[Depends(require_role(UserRole.TEHSILDAR))]
)
def certify_land_verification(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tehsildar exercises quasi-judicial revenue authority to certify land verification.
    This certification is the mandatory statutory gate to unblock transition to State Review.
    """
    return LandVerificationService.certify_verification(
        db=db,
        record_id=record_id,
        tehsildar_user=current_user
    )


@router.patch(
    "/land-verification/{record_id}/return",
    response_model=LandVerificationRead,
    status_code=status.HTTP_200_OK,
    summary="Return land verification for correction (Tehsildar only)",
    dependencies=[Depends(require_role(UserRole.TEHSILDAR))]
)
def return_land_verification_for_correction(
    record_id: str,
    payload: LandVerificationReturn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the verification record to Patwari/Lekhpal with mandatory statutory deficiency notes.
    """
    return LandVerificationService.return_for_correction(
        db=db,
        record_id=record_id,
        notes=payload.notes,
        tehsildar_user=current_user
    )


@router.get(
    "/cases/{case_id}/land-verification",
    response_model=Optional[LandVerificationRead],
    status_code=status.HTTP_200_OK,
    summary="Get latest land verification status for a case"
)
def get_case_land_verification(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns latest Section 4 land verification record for the case.
    Open to all roles with case-level jurisdiction access.
    """
    return LandVerificationService.get_verification_for_case(
        db=db,
        case_id=case_id,
        user=current_user
    )


@router.get(
    "/land-verification/tehsildar-queue",
    response_model=List[LandVerificationRead],
    status_code=status.HTTP_200_OK,
    summary="Get pending verification queue for Tehsildar",
    dependencies=[Depends(require_role(UserRole.TEHSILDAR))]
)
def get_tehsildar_pending_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists submitted Land Verification records awaiting certification in the Tehsildar's assigned Tehsil.
    """
    return LandVerificationService.list_tehsildar_queue(
        db=db,
        tehsildar_user=current_user
    )
