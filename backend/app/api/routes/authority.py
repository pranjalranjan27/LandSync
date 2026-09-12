# ==============================================================================
# Layer: API Routes — National Institutional Bodies & LARR Dispute Workflow
# (app/api/routes/authority.py)
# ALLOWED:
#   - Route endpoints for LARR Authority (referral-gated), Independent SIA Expert Group,
#     and R&R Monitoring Committee (read-only).
#   - Route endpoint for Collector / State Approver to refer compensation disputes.
# NOT ALLOWED:
#   - NEVER query database repositories directly from routes (delegate to CaseService).
#   - Never allow mutating endpoints for rr_monitoring_committee.
# ==============================================================================

import uuid
from typing import List, Union
from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.case import CaseRead, CaseDetail
from app.schemas.dispute_referral import (
    DisputeReferralCreate,
    DisputeReferralUpdate,
    DisputeReferralRead,
)
from app.services.case_service import CaseService

router = APIRouter(tags=["National Institutional Authorities & Dispute Referral"])


# --- 1. LARR Authority Referral-Based Queue ---
@router.get(
    "/authority/larr/cases",
    response_model=List[CaseDetail],
    status_code=status.HTTP_200OK if hasattr(status, "HTTP_200OK") else status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.LARR_AUTHORITY))]
)
def get_larr_authority_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns only cases formally referred to LARR Authority with an active (status != closed) referral.
    Visbility is governed strictly by referral records, NOT by jurisdiction filters.
    """
    return CaseService.list_cases_for_larr_authority(db=db, user=current_user)


# --- 2. Collector / State Approver Referral Action ---
@router.post(
    "/cases/{case_id}/refer-to-larr",
    response_model=DisputeReferralRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.DISTRICT_COLLECTOR, UserRole.STATE_APPROVER))]
)
def refer_case_to_larr(
    payload: DisputeReferralCreate,
    case_id: int = Path(..., description="ID of the case in compensation_disbursed stage to refer"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Refers a landowner compensation dispute to the LARR Authority under Section 64.
    Valid only when case is in compensation_disbursed stage.
    Does NOT change main case stage; parallel track dispute referral created with audit log.
    """
    return CaseService.refer_to_larr_authority(
        db=db,
        case_id=case_id,
        referring_user=current_user,
        reason=payload.reason
    )


# --- 3. LARR Authority Proceedings & Resolution Update ---
@router.patch(
    "/authority/larr/referrals/{referral_id}",
    response_model=DisputeReferralRead,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.LARR_AUTHORITY))]
)
def update_larr_referral(
    payload: DisputeReferralUpdate,
    referral_id: str = Path(..., description="UUID string of the DisputeReferral record"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates hearing dates, case number, or resolution outcome for a dispute referral.
    Setting status to 'closed' resolves the dispute and unblocks progression to possession_taken.
    """
    return CaseService.update_larr_referral(
        db=db,
        referral_id=referral_id,
        user=current_user,
        update_in=payload
    )


# --- 4. Independent SIA Expert Group National Case List ---
@router.get(
    "/authority/sia-expert/cases",
    response_model=List[CaseRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.INDEPENDENT_SIA_EXPERT))]
)
def get_sia_expert_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    National visibility across all cases for the Independent SIA Expert Group.
    Actionable review is governed on the frontend by stage === sia_in_progress.
    """
    return CaseService.list_cases(db=db, user=current_user)


# --- 5. R&R Monitoring Committee Oversight List (Strictly Read-Only) ---
@router.get(
    "/authority/rr-committee/cases",
    response_model=List[CaseRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.RR_MONITORING_COMMITTEE))]
)
def get_rr_committee_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    National read-only oversight across all cases for the R&R Monitoring Committee.
    Zero mutation endpoints exist for this role anywhere in the system.
    """
    return CaseService.list_cases(db=db, user=current_user)
