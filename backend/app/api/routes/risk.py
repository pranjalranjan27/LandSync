# ==============================================================================
# Layer: API Routes — Acquisition Risk Analysis (app/api/routes/risk.py)
# ALLOWED:
#   - Define HTTP endpoints for retrieving explainable risk assessments.
#   - Enforce authentication and RBAC roles (District Collector, State Approver, Policy Viewer).
# NOT ALLOWED:
#   - NO calculation logic or database queries here (delegate to services/risk_service.py).
# ==============================================================================

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.risk import RiskAssessmentResponse
from app.api.dependencies import get_current_user, require_role
from app.services.risk_service import RiskService

router = APIRouter(tags=["Risk Analysis"])


@router.get(
    "/{case_id}/risk-assessment",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(
            UserRole.DISTRICT_COLLECTOR,
            UserRole.STATE_APPROVER,
            UserRole.POLICY_VIEWER
        ))
    ]
)
def get_case_risk_assessment(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve dynamic on-read statutory risk assessment for an acquisition proposal.
    Accessible once the case has reached 'sia_complete' or later.
    Returns composite score (0-100), risk band, and explainable component breakdown.
    """
    return RiskService.compute_risk_assessment(db=db, case_id=case_id, user=current_user)
